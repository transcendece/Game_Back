import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/database/prisma.service';
import { UserDto } from 'src/DTOs/User/user.dto';
import { title } from 'process';

@Injectable()
export class UsersRepository {
    constructor (private prisma: PrismaService) {}

    async createUser (params : {data : UserDto}) : Promise<UserDto> {
        const { data } = params;
        return await this.prisma.user.create({data});
    }

    async getUserById (playerId : string) : Promise<UserDto | null> {
        console.log(`playerId : ${playerId}`)
        const data: UserDto = await this.prisma.user.findFirst({where : {
            id : playerId,
        }});
        if (!data)
            return null;
        return data;
    }
    
    async getUserByUsername (username : string) : Promise<UserDto | null> {
        console.log(`username : ${username}`)
        const data: UserDto = await this.prisma.user.findFirst({where : {
            username : username,
        }});
        if (!data)
            return null;
        return data;
    }

    async updateAvatar (id: string, _avatar: string) : Promise<UserDto> {
        return await this.prisma.user.update({
            where: {id},
            data: {
                avatar: _avatar,
            }
        })
    }

    async updateUsername(id: string, _username : string, isenabled: boolean) : Promise<any> {
        return await this.prisma.user.update({where : {id},
            data : {
                username : _username,
                IsEnabled: isenabled
            }})
    }

    async updateAcheivement(_title : string, id : string) : Promise<UserDto> {
        let userAchievements : string[] = await (await this.prisma.user.findUnique({where : {id}})).achievements
        let found : boolean = false;
        userAchievements.forEach((achievement) => {
            if (achievement == title)
                found = true;
        })
        if (!found)
            userAchievements.push(_title);
        return await this.prisma.user.update({where : {id},
            data : {
                achievements : userAchievements,
            }})
        }

    async deleteUser (id : string) : Promise <string> {
        await this.prisma.user.delete({where : {id}});
        return "deleted";
    }

}
