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
import { Model, ClientSession } from 'mongoose';

@WebSocketGateway({ cors: {
        origin: '*', // Разрешить все домены (для теста)
        credentials: true,
    },
    namespace: '/ws',})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectModel(Chat.name) private chatModel: Model<Chat>,
        private readonly jwtService: JwtService,
        private readonly roomService: RoomsService,
        private readonly taskService: TasksService,
        private readonly threadService: ThreadsService,
        private readonly messageService: MessageService
    ) {}

    @WebSocketServer() server: Server;

    async handleConnection(@ConnectedSocket() client: Socket) {
        console.log('New WebSocket connection:', client.handshake.url);
        const token = client.handshake.auth.token || client.handshake.query.token;
        try {
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            console.log('✅ User connected:', payload.sub);
        } catch (error) {
            console.error('❌ Invalid token:', error.message);
            client.disconnect(true); // Принудительное отключение
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
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
        if (!(await this.checkRoomAccess(client.data.userId, roomId))) {
            client.emit('error', 'Forbidden');
            return;
        }
        client.join(`room:${roomId}`);
        client.data.roomId = roomId;
        this.server.to(`room:${roomId}`).emit('userOnline', { userId: client.data.userId });
        client.emit('joinRoom', { roomId });
    }

    @SubscribeMessage('joinChat')
    async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
        if (!(await this.checkChatAccess(client.data.userId, chatId))) {
            client.emit('error', 'Forbidden');
            return;
        }
        client.join(`chat:${chatId}`);
        client.emit('joinedChat', { chatId });
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; message: CreateMessageDto }
    ) {
        if (!(await this.checkChatAccess(client.data.userId, data.chatId))) {
            client.emit('error', 'Forbidden');
            return;
        }
        const chat = await this.chatModel.findById(data.chatId).exec();
        if (!chat) {
            client.emit('error', 'Chat not found');
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let res;
            await session.withTransaction(async () => {
                res = await this.messageService.create(data.message, client.data.userId, session);
            });
            this.server.to(`chat:${data.chatId}`).emit('createMessage', { message: res, chatId: data.chatId });
            const task = await this.taskService.findById(chat.task.toString());
            this.server
                .to(`room:${task.room.toString()}`)
                .emit('newMessageNotification', { chatId: data.chatId, threadId: data.message.threadId });
        } catch (error) {
            client.emit('error', `Failed to send message: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }

    @SubscribeMessage('sendThread')
    async handleSendThread(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; message: CreateThreadDto }
    ) {
        if (!(await this.checkChatAccess(client.data.userId, data.chatId))) {
            client.emit('error', 'Forbidden');
            return;
        }
        const chat = await this.chatModel.findById(data.chatId).exec();
        if (!chat) {
            client.emit('error', 'Chat not found');
            return;
        }

        let session: ClientSession | null = null;
        try {
            session = await this.chatModel.db.startSession();
            let res;
            await session.withTransaction(async () => {
                res = await this.threadService.create(data.message, client.data.userId, session);
            });
            this.server.to(`chat:${data.chatId}`).emit('threadMessage', { thread: res, chatId: data.chatId });
            const task = await this.taskService.findById(chat.task.toString());
            this.server
                .to(`room:${task.room.toString()}`)
                .emit('newThreadNotification', { chatId: data.chatId });
        } catch (error) {
            client.emit('error', `Failed to send thread: ${error.message}`);
        } finally {
            if (session) session.endSession();
        }
    }

    private async checkChatAccess(userId: string, chatId: string): Promise<boolean> {
        const chat = await this.chatModel.findById(chatId);
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