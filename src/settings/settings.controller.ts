import { Body, Controller, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UsersRepository } from 'src/modules/users/users.repository';
import { Request } from 'express';
import { UserDto } from 'src/DTOs/User/user.dto';
import { settingsDto } from 'src/DTOs/settings/setting.dto';
import { JwtAuth } from 'src/auth/Guards/jwt.guard';

@Controller('Settings')
export class settingsController {
    constructor (private user: UsersRepository, private Cloudinary: CloudinaryService) {}
    @Get(':id')
    async GetUserData(@Param('id') id: string) : Promise<UserDto> {
        return await this.user.getUserById(id);
    }

    @Put('upload')
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(JwtAuth)
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req:Request & {user: UserDto}) {
        let achievements : string[] = (await this.user.getUserById(req.user.id)).achievements
        if (!achievements.includes('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322922/ds3v9fsgo1dlujvh8otp.png'))
            await this.user.updateAcheivement('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699322922/ds3v9fsgo1dlujvh8otp.png', req.user.id)
        const tmp = await this.Cloudinary.uploadImage(file, req.user.id)
        console.log(tmp);
        const heha = await this.user.updateAvatar(req.user.id, tmp.url)
        console.log(heha);
    }

    @Post('')
    @UseGuards(JwtAuth)
    async   updateUsername(@Body() data : settingsDto, @Req() req: Request & {user : UserDto}) : Promise<any> {
        console.log(`id : ${req.user.id}`);
        console.log(`username new : ${data}`);
        if (data.username != req.user.username)
            return await this.user.updateUsername(req.user.id, data.username);
    }
}
