import { JwtService } from "@nestjs/jwt";
import {  MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { messageDto } from "src/DTOs/message/message.dto";
import { converationRepositroy } from "src/modules/conversation/conversation.repository";
import { messageRepository } from "src/modules/message/message.repository";
import { UsersRepository } from "src/modules/users/users.repository";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
    constructor (private jwtService: JwtService, private user: UsersRepository, private conversation : converationRepositroy, private message: messageRepository) {
        this.clientsMap = new Map<string, Socket>();
    }
    @WebSocketServer() server: Server;
    private clientsMap: Map<string, Socket>;

    async handleConnection(client: Socket, ...args: any[]) {
      try {
            const jwt:any = client.handshake.headers.jwt;
            const user =  this.jwtService.verify(jwt);
            // console.log(user);
            // username  ==>   check if exist
            // extract userId  then check that userId ==> user
            console.log(user)
            const test = await this.user.getUserById(user.sub)
          if (test) {
            this.clientsMap.set(test.id, client);
            console.log(`this is a test : ${test.id} ****`)
          }
          else {
            console.log("user dosen't exist in database");
            client.emit('ERROR', "RAH KAN3REF BAK, IHCHEM")
            client.disconnect();
          }
        }
        catch (error) {
        console.log("invalid data : check JWT or DATABASE QUERIES")
      }
  }

      handleDisconnect(client: Socket) {
            this.clientsMap.delete(client.id); // Remove the client from the map when disconnected
        }

      @SubscribeMessage('SendMessage')
        async hanldeMessage(@MessageBody() message: messageDto) {
          //check if the sender is a valid user
          const sender = await this.user.getUserById(message.senderId);
          const reciever = await this.user.getUserById(message.recieverId);
          if (!sender || !reciever) {
            console.log("invalid data : Wrong sender or reciever info.")
            return ;
          }
          let achievementCheck : number = await this.conversation.numberOfConversations(sender.id)
          if (achievementCheck > 0) {
            if (!sender.achievements.includes('send your first message')) {
              await this.user.updateAcheivement('send your first message', sender.id)
              console.log('added first message')
            }
          }
          let conversations = await this.conversation.findConversations(reciever.id, sender.id);
          if (!conversations) {
            const tmp = await this.conversation.createConversation(reciever.id, sender.id)
          message.conversationId = tmp.id;
          this.sendToSocket(message);
          }
          else {
            message.conversationId = conversations.id;
            this.sendToSocket(message);
          }
        }

        async sendToSocket(message: messageDto) {
          console.log(message)
            const socket: Socket = this.clientsMap.get(message.recieverId);
            await this.message.CreateMesasge(message);
            if (socket) {
              socket.emit('RecieveMessage', message); // Replace 'your-event-name' with the actual event name
            } else {
              console.error(`Socket with ID ${message.recieverId} not found.`);
            }
        }
}