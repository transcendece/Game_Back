import { Body, Controller, Get, Param, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UsersRepository } from 'src/modules/users/users.repository';
import { Request } from 'express';
import { JwtAuth } from 'src/auth/jwt.guard';
import { UserDto } from 'src/DTOs/User/user.dto';
import { settingsDto } from 'src/DTOs/settings/setting.dto';

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
        if (!achievements.includes('customize your avatar'))
            await this.user.updateAcheivement('customize your avatar', req.user.id)
        const tmp = await this.Cloudinary.uploadImage(file, req.user.id)
        const heha = await this.user.updateAvatar(req.user.id, tmp.url)
        console.log(heha);
    }

    @Post('username')
    @UseGuards(JwtAuth)
    async   updateUsername(@Body() data : settingsDto, @Req() req: Request & {user : UserDto}) : Promise<any> {

        console.log(req.cookies[0])
        const user = req.user
        console.log(`id : ${req.user.id}`);
        console.log(`username new : ${data.username}`);

        return await this.user.updateUsername(req.user.id, data.username, data.checked_);
    }
}
