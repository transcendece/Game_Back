import { Injectable } from '@nestjs/common';
import { MatchDto } from 'src/DTOs/Match/match.dto';
import { UserDto } from 'src/DTOs/User/user.dto';
import { PrismaService } from 'src/modules/database/prisma.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class MatchesRepository {
    constructor (private prisma: PrismaService, private user : UsersRepository) {}

    async CreateMatch(playerA : UserDto, playerB : UserDto, _playerAScore : number, _playerBScore : number) : Promise<MatchDto> {
        try {
            return await this.prisma.match.create({data : {
                playerAId : playerA.id,
                playerBId : playerB.id,
                playerAScore : _playerAScore,
                playerBScore : _playerBScore,
            }})
        }
        catch (error) {
            console.log("error creating game")
        }
    }
    
    async GetMatches() : Promise<MatchDto[]> {
        return await this.prisma.match.findMany();
    }

    async findMatchesByUserId(id: string): Promise<MatchDto[]> {
        console.log(id);
        return await this.prisma.match.findMany({
            where: {
                OR: [
                    { playerAId: id },
                    { playerBId: id },
                ],
            },
        });
    }

    async CheckForGamesAchievements(matches: MatchDto[], _id : string) : Promise<any> {
        let user : UserDto = await this.prisma.user.findUnique({where : {id : _id}})
        console.log(user);
        if (matches.length > 0) {
            if (!user.achievements.includes("play your first game"))
                this.user.updateAcheivement("play your first game", _id)
        }
        if (matches.length > 2){
            if (!user.achievements.includes("play 3 games"))
                this.user.updateAcheivement("play 3 games", _id)
        } 
        if (matches.length > 9){
            if (!user.achievements.includes("play 10 games"))
                this.user.updateAcheivement("play 10 games", _id)
        }
        if (matches.length > 99){
            if (!user.achievements.includes("play 100 games"))
            this.user.updateAcheivement("play 100 games", _id)
        }
        matches.forEach((match) => {
            if (!user.achievements.includes("win a game")) {
                if (match.playerAId == _id) {
                    if (match.playerAScore > match.playerBScore)
                        this.user.updateAcheivement("win a game", _id)
                }
                else {
                    if (match.playerAScore < match.playerBScore)
                        this.user.updateAcheivement("win a game", _id)
                }
            }
        })
        return ;
    }
}
