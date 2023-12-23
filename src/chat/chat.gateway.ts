import { JwtService } from "@nestjs/jwt";
import {  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UserDto } from "src/DTOs/User/user.dto";
import { channelDto } from "src/DTOs/channel/channel.dto";
import { channelMessageDto } from "src/DTOs/channel/channel.messages.dto";
import { messageDto } from "src/DTOs/message/message.dto";
import { converationRepositroy } from "src/modules/conversation/conversation.repository";
import { messageRepository } from "src/modules/message/message.repository";
import { UsersRepository } from "src/modules/users/users.repository";
import { ChannelsService } from "./chat.service";
import { chatDto } from "src/DTOs/chat/chat.dto";
import { AllExceptionsSocketFilter } from "./socket.exceptionHandler";
import { Inject, UseFilters } from "@nestjs/common";
import { MatchMaking } from "src/DTOs/User/matchMaking";
import { ClientProxy } from "@nestjs/microservices";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { use } from "passport";
import { email } from "valibot";

@WebSocketGateway(8888, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  }
})
@UseFilters(new AllExceptionsSocketFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
    constructor (
      private jwtService: JwtService, 
      private user: UsersRepository, 
      private conversation : converationRepositroy, 
      private message: messageRepository, 
      private channel : ChannelsService,
      private eventEmitter: EventEmitter2
      ) {
        this.clientsMap = new Map<string, Socket>();
    }
    @WebSocketServer() server: Server;
    private clientsMap: Map<string, Socket>;

    async handleConnection(client: Socket, ...args: any[]) {
      try {
        console.log("new connection ....");
        
            let cookie : string = client.client.request.headers.cookie;
            console.log("00000000000 cookie 00000000000 >>>>> ",cookie);
            
            if (cookie) {
              const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
              let user;
              user =  this.jwtService.verify(jwt);
              console.log(user)
              if (user) {
                const test = await this.user.getUserById(user.sub);
                if (test) {
                  console.log("map :=====>",this.clientsMap.has(test.id));
                  let exist : boolean = this.clientsMap.has(test.id);
                  if (exist)
                  {
                    client.emit('ERROR', "YOU ARE ALREADY CONNECTED ...")
                    client.disconnect();
                  }
                  else {
                    this.clientsMap.set(test.id, client);
                    await this.user.updateUserOnlineStatus(true, user.sub)
                  }
                }
              }
            }
          else {
            console.log("user dosen't exist in database");
            client.emit('ERROR', "RAH KAN3REF BAK, IHCHEM")
            client.disconnect();
          }
        }
        catch (error) {
          console.log("user dosen't exist in database");
          client.emit('ERROR', "RAH KAN3REF BAK, IHCHEM")
          client.disconnect()
          console.log("invalid data : check JWT or DATABASE QUERIES")
      }
  }

      async handleDisconnect(client: Socket) {
        try {
          let cookie : string = client.client.request.headers.cookie;
          if (cookie) {
            const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
            let user;
            user =  this.jwtService.verify(jwt);
            if (user) {
              const test = await this.user.getUserById(user.sub)
              if (test) {
                console.log(test.id);
                await this.user.updateUserOnlineStatus(false, test.id)
                console.log(`this is a test : ${test.id} ****`)
              }
              console.log("disconnected : ", user.sub);
              this.clientsMap.delete(user.sub);
            }
          }
        } catch (error) {
          return;
        }
      }

      @SubscribeMessage('channelMessage')
      async handleChannelMessage(@MessageBody() message: channelMessageDto,@ConnectedSocket() client : Socket) {
        try {
          console.log("0 ===> ", message);
          let cookie : string = client.client.request.headers.cookie;
          if (cookie) {
            const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
            let user;
            user = await this.jwtService.verify(jwt);
            if (user) {
              console.log("1");
              
              const _user = await this.user.getUserById(user.sub)
              if (_user) {
                  let channelId : string = "";
                  if (!_user.achievements.includes('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322994/vp6r4ephqymsyrzxgd0h.png')) {
                    await this.user.updateAcheivement('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322994/vp6r4ephqymsyrzxgd0h.png', _user.id)
                  }
                  let tmpChannel : channelDto = await this.channel.getChannelByName(message.channelName)
                  if (tmpChannel) {
                    channelId = tmpChannel.id;
                  }
                  let check : boolean = await this.channel.canSendMessageToChannel(_user.id, message.channelName)
                  console.log("has privilage to send on channel :", check);
                  
                  let sent : boolean = false;
                  if (check) {
                    let channelUsersIds : string[] = await this.channel.getChannelUsersId(message.channelName)
                    channelUsersIds.map((id)=> {
                    let socket: Socket = this.clientsMap.get(id)
                      if (socket && !_user.bandBy.includes(id) && !_user.bandUsers.includes(id)) {
                        message.sender = _user.username
                        sent = true;
                        socket.emit("channelMessage", message)
                      }
                    })
                  } else {
                    let socket : Socket = this.clientsMap.get(_user.id)
                    if (socket){
                      socket.emit("ERROR", "you can't Send This Message .... ");
                    }
                  }
                  if (sent) {
                    await this.channel.createChannelMessage(message, channelId, _user.id);
                }
            }
          }
        }
        else
          throw('unAuthorized Action ....')
      }
        catch (error) {
          console.log(error);
        }
      }
      

      //Invite client 
      @SubscribeMessage('INVITE')
      async HandleGameInvite(@MessageBody() recieverId : string, @ConnectedSocket() client : Socket) {
        try {
          
          // need to check if the user is already in game or not before sending the notification 
          let cookie : string = client.client.request.headers.cookie;
          if (cookie) {
            const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
            let user;
            user =  this.jwtService.verify(jwt);
            console.log("reciever : ", recieverId);
            console.log("ahjkhadfhadjkfhadjhf : ", user);
            
            if (user) {
              let customer : Socket = this.clientsMap.get(recieverId)
              if (customer) {
                customer.emit("GameInvite",{ recieverId: recieverId, senderId: user.sub})
              }
              else {
                client.emit("ERROR", `${recieverId} is Not Online For the moment `)
              }
            }
          }
        } catch (error) {
        }
      }
      
      @SubscribeMessage('GameInvite')
      async HandleGame(@MessageBody() res : {state: string, recieverId: string, senderId: string}, @ConnectedSocket() client : Socket) {
        try {
          console.log("creating game : ", res.state);
          let cookie : string = client.client.request.headers.cookie;
          if (cookie) {
            let playerA : Socket;
            let playerB : Socket;
            const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
            let user;
            user =  this.jwtService.verify(jwt);
            if (user && res.state === "OK") {
              // here we emit to the game gateway to start the game when these id's are connected
              // emit to the users a redirection action ...
              playerA  = this.clientsMap.get(res.recieverId)
              playerB  = this.clientsMap.get(res.senderId)
              if (playerA && playerB) {
                playerA.emit("EnterGame", "OK")
                playerB.emit("EnterGame", "OK")
                this.eventEmitter.emit("chat.INVITE", {recieverId : res.recieverId, senderId: res.senderId})
              }
              else {
                if (!playerA && playerB)
                  playerB.emit("ERROR", "Can't play Game the other player wen't offline ...");
                else if (!playerB && playerA)
                  playerA.emit("ERROR", "Can't play Game the other player wen't offline ...");
              }
            }
            else {
              playerA  = this.clientsMap.get(res.recieverId)
              playerB  = this.clientsMap.get(res.senderId)
              if (playerA && playerB) {
                playerA.emit("ERROR", "invite Canceled .")
                playerB.emit("ERROR", "invite Canceled .")
              }
              else {
                client.emit("ERROR", "invitation Declined ...")
              }
            }
            console.log("received in GameInvite : ", res.senderId,"   ", res.recieverId);
          }
        } catch (error) {
          client.emit("ERROR", "TRY AGAIN LATER ....")
        }
      }


      @SubscribeMessage('SendMessage')
        async hanldeMessage(@MessageBody() message: messageDto, @ConnectedSocket() client : Socket) {
          try {
            let cookie : string = client.client.request.headers.cookie;
            if (cookie) {
              const jwt:string = cookie.substring(cookie.indexOf('=') + 1)
              let user;
              user =  this.jwtService.verify(jwt);
              if (user) {
                  const sender = await this.user.getUserById(user.sub);
                  const reciever = await this.user.getUserById(message.recieverId);
                  if (!sender || !reciever || (sender.id == reciever.id)) {
                    client.emit("ERROR", "YOU CAN't Text yourself Go buy a Note Book !")
                    throw("invalid data : Wrong sender or reciever info.")
                  }
                  if (reciever.bandUsers.includes(sender.id)) {
                    throw("a banned user can't send messages .");
                  }
                  let achievementCheck : number = await this.conversation.numberOfConversations(sender.id)
                  if (achievementCheck > 0) {
                    if (!sender.achievements.includes('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322994/vp6r4ephqymsyrzxgd0h.png')) {
                      await this.user.updateAcheivement('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322994/vp6r4ephqymsyrzxgd0h.png', sender.id)
                      console.log('added first message')
                  }
                }
                let conversations = await this.conversation.findConversations(reciever.id, sender.id);
                if (!conversations) {
                  const tmp = await this.conversation.createConversation(reciever.id, sender.id)
                  message.conversationId = tmp.id;
                  await this.sendToSocket(message);
                }
                else {
                  message.conversationId = conversations.id;
                  await this.sendToSocket(message); 
                }
              }
        }
        else {
          throw ('invalid Request : not Authorized ...')
        }
        }
        catch (error) {
          console.log(error)
        }
      }
      
      async sendToSocket(message: messageDto) {
        try {
          console.log('message in send socket : ',message)
          let _reciever : UserDto = await this.user.getUserById(message.recieverId)
          console.log("reciever is : ", _reciever);
          if (_reciever) {
            const socket: Socket = this.clientsMap.get(_reciever.id);
            await this.message.CreateMesasge(message);
            if (socket) {
              this.conversation.updateConversationDate(message.conversationId)
              let data : chatDto = new chatDto;
              data.content = message.content
              data.sender = message.senderId
              data.avatar = _reciever.avatar
              data.isOwner = false
              data.conversationId = message.conversationId 
              socket.emit('RecieveMessage', data);
            } else {
              this.conversation.updateConversationDate(message.conversationId)
              console.error(`Socket with ID ${message.recieverId} not found.`);
            }
          }
          }
          catch (error) {
            console.log(error)
          }
        }
}