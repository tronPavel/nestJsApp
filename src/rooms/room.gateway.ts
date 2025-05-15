import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from './rooms.service';
import { TasksService } from '../task/tasks.service';
import { ThreadsService } from '../threads/threads.service';
import { MessageService } from '../messages/messages.service';
import { CreateThreadDto } from '../threads/dto/create-thread.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Chat } from '../chat/chat.schema';
import { Model, ClientSession, Types } from 'mongoose';
import { UpdateMessageDto } from '../messages/dto/update-message.dto';
import { UpdateThreadDto } from '../threads/dto/update-thread.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Разрешить все домены (для теста)
        credentials: true,
    },
    namespace: '/ws',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        @InjectModel(Chat.name) private chatModel: Model<Chat>,
        private readonly jwtService: JwtService,
        private readonly roomService: RoomsService,
        private readonly taskService: TasksService,
        private readonly threadService: ThreadsService,
        private readonly messageService: MessageService,
    ) {}

    async handleConnection(@ConnectedSocket() client: Socket) {
        console.log('New WebSocket connection:', client.handshake.url);
        const token = client.handshake.auth.token || client.handshake.query.token;
        try {
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
        } catch (error) {
            client.disconnect(true);
            console.error('Invalid token:', error.message);
        }
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        if (client.data.roomId) {
            this.server.to(`room:${client.data.roomId}`).emit('userOffline', {
                userId: client.data.userId,
            });
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const roomId = data.roomId;
        if (!roomId) {
            client.emit('error', { message: 'Room ID is required' });
            return;
        }

        if (!(await this.checkRoomAccess(client.data.userId, roomId))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        client.join(`room:${roomId}`);
        client.data.roomId = roomId;
        this.server.to(`room:${roomId}`).emit('userOnline', { userId: client.data.userId });
        client.emit('joinRoom', { roomId, success: true });
    }
    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
        if (!(await this.checkChatAccess(client.data.userId, chatId))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        client.join(`chat:${chatId}`);
        client.emit('joinedChat', { chatId, success: true });
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; message: CreateMessageDto },
    ) {
        if (!(await this.checkChatAccess(client.data.userId, data.chatId))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        const chat = await this.chatModel.findById(data.chatId).exec();
        if (!chat) {
            client.emit('error', { message: 'Chat not found' });
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let message;
            await session.withTransaction(async () => {
                message = await this.messageService.create(data.message, client.data.userId, session);
            });
            this.server.to(`chat:${data.chatId}`).emit('createMessage', { message, chatId: data.chatId });
            const task = await this.taskService.findById(chat.task.toString());
            this.server
                .to(`room:${task.room.toString()}`)
                .emit('newMessageNotification', { chatId: data.chatId, threadId: data.message.threadId });
            client.emit('sendMessageSuccess', { message, success: true });
        } catch (error) {
            client.emit('error', { message: `Failed to send message: ${error.message}` });
        } finally {
            if (session) session.endSession();
        }
    }

    @SubscribeMessage('sendThread')
    async handleSendThread(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; message: CreateThreadDto },
    ) {
        if (!(await this.checkChatAccess(client.data.userId, data.chatId))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        const chat = await this.chatModel.findById(data.chatId).exec();
        if (!chat) {
            client.emit('error', { message: 'Chat not found' });
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let thread;
            await session.withTransaction(async () => {
                thread = await this.threadService.create(data.message, client.data.userId, session);
            });
            this.server.to(`chat:${data.chatId}`).emit('threadMessage', { thread, chatId: data.chatId });
            const task = await this.taskService.findById(chat.task.toString());
            this.server.to(`room:${task.room.toString()}`).emit('newThreadNotification', { chatId: data.chatId });
            client.emit('sendThreadSuccess', { thread, success: true });
        } catch (error) {
            client.emit('error', { message: `Failed to send thread: ${error.message}` });
        } finally {
            if (session) session.endSession();
        }
    }

    @SubscribeMessage('updateMessage')
    async handleUpdateMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; update: UpdateMessageDto }
    ) {
        if (!(await this.checkMessageAuthor(client.data.userId, data.messageId))) {
            client.emit('error', 'Forbidden');
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let updatedMessage;
            await session.withTransaction(async () => {
                updatedMessage = await this.messageService.update(data.messageId, data.update, session);
            });

            const message = await this.messageService.findById(data.messageId);
            const thread = await this.threadService.findById(message.thread);
            const chatId = thread.chat.toString();

            this.server.to(`chat:${chatId}`).emit('messageUpdated', {
                message: updatedMessage,
                chatId
            });
        } catch (error) {
            client.emit('error', `Failed to update message: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }
    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() messageId: string
    ) {
        if (!(await this.checkMessageAuthor(client.data.userId, messageId))) {
            client.emit('error', 'Forbidden');
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            await session.withTransaction(async () => {
                await this.messageService.delete(messageId, session);
            });

            const message = await this.messageService.findById(messageId);
            const thread = await this.threadService.findById(message.thread);
            const chatId = thread.chat.toString();

            this.server.to(`chat:${chatId}`).emit('messageDeleted', {
                messageId,
                chatId
            });
        } catch (error) {
            client.emit('error', `Failed to delete message: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }
    @SubscribeMessage('updateThread')
    async handleUpdateThread(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { threadId: string; update: UpdateThreadDto }
    ) {
        const thread = await this.threadService.findById(data.threadId);
        const mainMessage = await this.messageService.findById(thread.mainMessage.toString());
        if (mainMessage.sender.id !== client.data.userId) {
            client.emit('error', 'Forbidden');
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let updatedThread;
            await session.withTransaction(async () => {
                const messageUpdate: UpdateMessageDto = { content: data.update.mainMessage, tags: data.update.tags };
                await this.messageService.update(mainMessage._id.toString(), messageUpdate, session);
                updatedThread = await this.threadService.findById(data.threadId);
            });

            this.server.to(`chat:${thread.chat.toString()}`).emit('threadUpdated', {
                thread: updatedThread,
                chatId: thread.chat.toString()
            });
        } catch (error) {
            client.emit('error', `Failed to update thread: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }
    @SubscribeMessage('deleteThread')
    async handleDeleteThread(
        @ConnectedSocket() client: Socket,
        @MessageBody() threadId: string
    ) {
        const thread = await this.threadService.findById(threadId);
        const mainMessage = await this.messageService.findById(thread.mainMessage.toString());
        if (mainMessage.sender.id !== client.data.userId) {
            client.emit('error', 'Forbidden');
            return;
        }

        let session: ClientSession | null = null;
        try {
            await this.threadService.delete(threadId, );

            this.server.to(`chat:${thread.chat.toString()}`).emit('threadDeleted', {
                threadId,
                chatId: thread.chat.toString()
            });
        } catch (error) {
            client.emit('error', `Failed to delete thread: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }
    private async checkChatAccess(userId: string, chatId: string): Promise<boolean> {
        const chat = await this.chatModel.findById(chatId).exec();
        if (!chat) return false;
        const task = await this.taskService.findById(chat.task.toString());
        return task.participants.some((p) => p._id.toString() === userId);
    }

    private async checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
        const room = await this.roomService.findById(roomId);
        return room && room.participants.some((p) => p._id.toString() === userId);
    }

    private async checkMessageAuthor(userId: string, messageId: string): Promise<boolean> {
        const message = await this.messageService.findById(messageId);
        return message.sender.id === userId;
    }
}