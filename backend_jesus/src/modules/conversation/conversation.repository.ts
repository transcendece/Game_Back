import { Injectable } from "@nestjs/common";
import { ConversationDto } from "src/DTOs/conversation/conversation.dto";
import { PrismaService } from "src/modules/database/prisma.service";

@Injectable()
export class converationRepositroy {
    constructor (private Prisma : PrismaService) {}

    async createConversation(_recieverId : string, _senderId : string) : Promise<ConversationDto> {
        return await this.Prisma.conversation.create({data : {
            recieverId : _recieverId,
            senderId : _senderId,
        }})
    }

    async numberOfConversations(_id : string) : Promise<number> {
        let count  = await this.Prisma.conversation.findMany({where : {
            OR : [
                {
                    senderId : _id,
                },
                {
                    recieverId : _id,
                }]}})
        return count.length;
    }

    async findConversations(_recieverId : string, _senderId : string) : Promise<ConversationDto | null> {
        return await this.Prisma.conversation.findFirst({where : {
            OR : [
                {   senderId : _senderId,
                    recieverId : _recieverId
                },
                {
                    recieverId : _senderId,
                    senderId : _recieverId
                }
            ]
        }})
    }

    async deleteConversation(conversationData: ConversationDto ) : Promise<string> {
        await this.Prisma.conversation.delete({where : {id : conversationData.id,}})
        return "deleted"
    }
}