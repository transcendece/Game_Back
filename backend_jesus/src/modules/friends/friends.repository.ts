import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/database/prisma.service';
import { FriendDto } from 'src/DTOs/friends/friend.dto';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class FriendsRepository {
    constructor (private prisma: PrismaService, private user: UsersRepository) {}

    async createFriend (data : FriendDto, _id : string) : Promise<FriendDto> {
        let friends : FriendDto[] =  await this.prisma.friend.findMany({
            where: {
                OR: [
                    { inviteRecieverId: _id },
                    { inviteSenderId: _id },
                ],
            },
        });
        let check : boolean = false
        friends.forEach((friend) => {
            if (friend.inviteRecieverId == data.inviteRecieverId && friend.inviteSenderId == data.inviteSenderId)
                check = true
        })
        let tmp;
        if (!check)
            tmp = this.prisma.friend.create({data});
        else
            tmp = undefined
        let user : string[] = (await this.prisma.user.findFirst({where : {id : _id}})).achievements
        if (friends.length > 0)
            if (!user.includes('add your first friend'))
                this.user.updateAcheivement('add your first friend', _id)
        if (friends.length > 9)
            if (!user.includes('get 10 friends'))
                this.user.updateAcheivement('get 10 friends', _id)
        return tmp
    }

    async getFriends (_id : string) : Promise<FriendDto[]> {
        const data: FriendDto[] = await this.prisma.friend.findMany({where : {id : _id}});
        return data;
    }

    async updateFriend (id: string, data: FriendDto) : Promise<FriendDto> {
        return await this.prisma.friend.update({
            where: {id},
            data: {
                latestMessage : data.latestMessage
            }
        })
    }

    async deleteFriend (id: string ) : Promise<string> {
        await this.prisma.friend.delete({where : {id}});
        return `Deleted : ${id}`
    }
}
