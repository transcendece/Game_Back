import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import { UserDto } from "src/DTOs/User/user.dto";
import { FriendDto } from "src/DTOs/friends/friend.dto";
import { InviteDto } from "src/DTOs/invitation/invite.dto";
import { converationRepositroy } from "src/modules/conversation/conversation.repository";
import { FriendsRepository } from "src/modules/friends/friends.repository";
import { InvitesRepository } from "src/modules/invites/invites.repository";
import { UsersRepository } from "src/modules/users/users.repository";
import { ChannelsService } from "./chat.service";
import { channelDto } from "src/DTOs/channel/channel.dto";
import { Request, Response } from "express";
import { channelMessageDto } from "src/DTOs/channel/channel.messages.dto";
import { channelParams } from "src/DTOs/channel/channel.params.dto";
import { frontData } from "src/DTOs/chat/conversation.dto";
import { messageRepository } from "src/modules/message/message.repository";
import { JwtAuth } from "src/auth/Guards/jwt.guard";
import { channelSettings } from "src/DTOs/settings/setting.channel.dto";
import { ConversationDto } from "src/DTOs/conversation/conversation.dto";
import { UserSettingsDto } from "src/DTOs/settings/settings.user.dto";
import channelsAsConversations from "src/DTOs/channel/channel.response.dto";



@Controller('Chat')
export class ChatController {
    constructor (private conversation: converationRepositroy
                , private user : UsersRepository
                , private invite : InvitesRepository
                , private friend: FriendsRepository
                , private channel : ChannelsService
                , private message: messageRepository) {}

    @Get('user')
    @UseGuards(JwtAuth)
    async getUserMessages(@Req() req: Request & {user : UserDto}, @Res() res: Response) :Promise<any> {
        try {
            let _user : UserDto = await this.user.getUserById(req.user.id)
            let data : frontData[] = [];
            if (_user) {
                let conversations : ConversationDto[] = await this.conversation.getConversations(_user.id)
                if  (conversations) {
                    for (let index : number = 0; index < conversations.length; index++) {
                        let tmp : frontData = new frontData;
                        let _sender : UserDto = await this.user.getUserById(conversations[index].senderId)
                        let _reciever : UserDto = await this.user.getUserById(conversations[index].recieverId)
                        if (_sender && _reciever && !_sender.bandUsers.includes(_reciever.id) && !_reciever.bandUsers.includes(_sender.id)) {
                            tmp.Conversationid = conversations[index].id   
                            tmp.owner = _user.username
                            tmp.avatar = (_user.username == _sender.username) ? _reciever.avatar : _sender.avatar;
                            tmp.username = (_user.username == _sender.username) ? _reciever.username : _sender.username;
                            tmp.online = false;
                            tmp.id = 0
                            tmp.updatedAt = conversations[index].updatedAt
                            tmp.messages = await this.message.getMessages(conversations[index], req.user.id)
                            data.push(tmp)
                        }
                    }
                }
                else {
                    let empty : frontData;
                    empty.messages = [];
                    empty.Conversationid = null;
                    empty.avatar = null;
                    empty.online = false;
                    empty.owner = null;
                    empty.username = null;
                    res.status(200).json(empty);
                    return
                }
                data.sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf());
                let index: number = 0
                data.forEach((_data) => {
                    _data.id = index++;
                })
                res.status(200).json(data)
                return
            }
            else
                throw('invalid User .')
        }
        catch (error) {
            res.status(400).json('invalid User ...')
        }
    }

    @Get('channel')
    @UseGuards(JwtAuth)
    async getChannels(@Req() req: Request & {user : UserDto}, @Res() res: Response) : Promise<any> {
        try {
            
            let channelRes : channelsAsConversations = {
                channelNames : []
            };
            let data : channelDto[] = await this.channel.getUserChannels(req.user.username);
            if (data) {
                for (let index: number = 0; index < data.length; index++) {
                    channelRes.channelNames.push(data[index].name)
                }
                res.status(200).json(channelRes)
                return
            }
            else{
                res.sendStatus(400)
                throw "invalid data .."
            }
        }
        catch (error) {
            res.status(400)
        }
    }
    
    @Post('channel')
    @UseGuards(JwtAuth)
    async getChannelsMessages(@Req() req: Request & {user : UserDto}, @Body('_channel') _channel : string, @Res() res: Response) : Promise<any> {
        try {
            console.log("recieved : ",_channel);
            
            let data : channelMessageDto[] =  await this.channel.getChannelMessages(_channel)
            res.status(200).json(data);
        } catch (error) {
            console.log("erroriiiiiii ");
            res.status(400);
        }
    }

    @Get('channelSettings')
    @UseGuards(JwtAuth)
    async   channelSettings(@Req() req: Request & {user : UserDto}, @Res() res: Response) : Promise<any> {
        let tmpUser : UserDto = await this.user.getUserById(req.user.id)
        if (!tmpUser) {
            return
        }
        console.log("requster ======>  : ", tmpUser);
        
        let data: channelDto[] = await this.channel.getChannelSettingsData(tmpUser.username);
        let SettingsData : channelSettings[] = []
        data.forEach((channel)=> {
            SettingsData.push({
                channelName : channel.name,
                users : channel.users,
                admins : channel.admins,
                bandUsers : channel.bannedUsers,
                mutedUsers : channel.mutedUsersId
            })
        })
        res.status(200).json(SettingsData)
    }

    @Get('userSettings')
    @UseGuards(JwtAuth)
    async getUserDataForSettings(@Req() req: Request & {user: UserDto}, @Res() res: Response) : Promise<any> {
        try {
            let data : UserSettingsDto = new UserSettingsDto() ;
            let userData : UserDto = await this.user.getUserById(req.user.id)
            let invitations : InviteDto[] = await this.invite.getUserInviations(req.user.id)
            let friends : FriendDto[] = await this.friend.getFriends(req.user.id);
            if (userData) {
                data.bandUsers = userData.bandUsers
                if (invitations) {
                    for (let index : number = 0; index < invitations.length; index++) {
                        if (!data.bandUsers.includes(invitations[index].invitationSenderId)) {
                            let tmp : UserDto = await this.user.getUserById(invitations[index].invitationSenderId)
                            if (tmp) {
                                data.invitations.push(tmp.username)
                            }
                        }
                    }
                }
                if (friends) {
                    let tmp : UserDto;
                    for (let index : number = 0; index < friends.length; index++) {
                        if (friends[index].inviteRecieverId == req.user.id && !data.bandUsers.includes(friends[index].inviteSenderId)) {
                            tmp  = await this.user.getUserById(friends[index].inviteSenderId)
                            if (tmp)
                                data.friends.push(tmp.username);
                        }
                        else if (friends[index].inviteSenderId == req.user.id && !data.bandUsers.includes(friends[index].inviteRecieverId)) {
                            tmp = await this.user.getUserById(friends[index].inviteRecieverId)
                            if (tmp)
                                data.friends.push(tmp.username);
                        }
                    }
                }
                let banUsernames : string[] = []
                if (data.bandUsers) {
                    for (let index : number = 0; index < data.bandUsers.length ; index++) {
                        let tmpUser : UserDto = await this.user.getUserById(data.bandUsers[index]);
                        if (tmpUser)
                            banUsernames.push(tmpUser.username) 
                    }
                    // console.log(banUsernames);
                }
                data.bandUsers = banUsernames;
                data.user = req.user.id;
                res.status(200).json({data})
            }
            else {
                res.status(400).json({message : "User dosen't exist in database ..."})
            }
    } catch(error) {
        res.status(400).json({message : "Error ..."})
    }
}


    @Post('removeFriend')
    @UseGuards(JwtAuth)
    async removeFriend(@Req() req: Request & {user : UserDto}, @Body('username') username: string) : Promise<any> {
        try {
            console.log("recived a request ////////////   ===> ", username);
            let tmp : UserDto = await this.user.getUserByUsername(username)
            if (tmp)
                return await this.friend.deleteFriend(tmp.id, req.user.id);
            // need to add an else to inform the user that the username dosen't exist.
        }
        catch(error) {
            console.log(error);
        }
    }


    @Post('invite')
    @UseGuards(JwtAuth)
    async SendInvitation(@Body('username') username : string, @Req() req: Request & {user : UserDto}, @Res() res: Response) : Promise<any> {
        try {
            if (req.user.username == username) {
                res.status(400).json("Sir tel3eb")
                return 
            }
            let invitation : InviteDto = {
                invitationRecieverId : "",
                invitationSenderId : "",
                inviteStatus : 0,
            }
            let tmpUser : UserDto = await this.user.getUserByUsername(username)
            if (!tmpUser) {
                res.sendStatus(400)
                return 
            }
            invitation.invitationSenderId = req.user.id;
            invitation.invitationRecieverId  = tmpUser.id;
            let tmp : InviteDto = await this.invite.createInvite(invitation);
            if (tmp == null) {
                res.status(400).json("Already friends .")
                return 
            }
            else {
                console.log("succes");
                res.status(200).json(tmp)
                return 
            }
            
            }
        catch (error) {
            console.log(error);
            res.status(400).json({message : "Error ..."})
        }
    }

    @Post('createChannel')
    @UseGuards(JwtAuth)
    async createChannel(@Body() channelData : channelDto, @Req() req: Request & {user : UserDto}, @Res() res: Response) : Promise<any> {
        try {
            console.log(channelData);
            let test : channelDto = await this.channel.createChannel(channelData, req.user.id);
            console.log(test);
            let data : channelSettings = {
                bandUsers : [],
                admins : [],
                channelName : "",
                mutedUsers : [],
                users : []
            }
            this.user.updateAcheivement('https://res.cloudinary.com/dvmxfvju3/image/upload/v1699323620/qodwzbr6cxd74m14i4ad.png', req.user.id)
            if (test ) {
                data.admins = test.admins
                data.bandUsers = test.bannedUsers
                data.channelName = test.name
                data.mutedUsers = test.mutedUsersId
                data.users = test.users
            }
            res.status(200).json(data)
        }
        catch (error) {
            res.status(400).json("invalid Data .")
        } 
    }


    @Post('BanUser')
    @UseGuards(JwtAuth)
    async   BanUser(@Req() req: Request & {user : UserDto} , @Body('username') username: string, @Res() res: Response) : Promise<any> {
        try {
            console.log("hahowaaaa ====> ", username);
            
            let userToBan : UserDto = await this.user.getUserByUsername(username)
            let requester : UserDto = await this.user.getUserById(req.user.id)
            if (userToBan && requester && !requester.bandUsers.includes(userToBan.id)) {
                let tmp : string = await this.channel.BanUser(req.user, userToBan)
                res.status(200).json(tmp)
                return 
            }
            else {
                res.status(400).json("user dosen't exist in database .")
            }
        }   catch (error) {
            res.status(400).json("user dosen't exist in database .")
        }
    }
    
    @Post('unBanUser')
    @UseGuards(JwtAuth)
    async   unBanUser(@Req() req: Request & {user : UserDto} , @Body('username') username: string, @Res() res: Response) : Promise<any> {
        try {
            let userTounBan : UserDto = await this.user.getUserByUsername(username)
            let requester : UserDto = await this.user.getUserById(req.user.id)
            if (userTounBan && requester && requester.bandUsers.includes(userTounBan.id)) {
                let tmp :string = await this.channel.unBanUser(req.user, userTounBan)
                res.status(200).json(tmp)
            }
            else
                res.status(400).json("user dosen't exist in database .")    
        } catch (error) {
            res.status(400).json("user dosen't exist in database .")
        }
    }

    @Post('mute')
    @UseGuards(JwtAuth)
    async muteUser(@Req() req: Request & {user : UserDto}, @Body('channel') channel : string, @Body('username') username : string, @Res() res: Response) : Promise<any> {
        try { 
            console.log("params to mute :  username :" , username, " channel : ", channel);
            let UsernameToMute : UserDto = await this.user.getUserByUsername(username)
            let tmpChannel : channelDto = await this.channel.getChannelByName(channel)
            console.log(UsernameToMute, tmpChannel);
            if (UsernameToMute && tmpChannel) {
                if (!tmpChannel.admins.includes(req.user.id))
                    throw ("not channel owner.")
                if (!tmpChannel.bannedUsers.includes(UsernameToMute.id)) {
                    await this.channel.muteUser(UsernameToMute.id, channel);
                    res.status(200).json("Ok")
                    return
                }
                else {
                    res.status(200).json("Already Muted ...")
                    return
                }
            }
        } catch (error) {
            res.status(400).json("NEED AUTH ...")
        }
    }

    @Post('ChannelAddUser')
    @UseGuards(JwtAuth)
    async addUserToChannel(@Body() channelName: channelDto, @Body('username') username : string, @Req() req : Request & {user : UserDto}, @Res() res: Response) : Promise<any> {
        try {
                let channel : channelDto = await this.channel.getChannelByName(channelName.name);
                let tmpUser : UserDto = await this.user.getUserByUsername(username);
                if (tmpUser && channel) {
                    console.log("protection : ", channel.IsProtected);
                    if (channel.users.includes(tmpUser.id))
                        return "already in channel ."
                    if (channel.IsProtected) {
                        console.log(channelName.password, channel.passwordHash);

                        await this.channel.checkPassword(channelName.password, channel.password).then(isMatch => {
                        if (!isMatch) {
                            res.status(400).json("INVALID PASSWORD ...")
                            return
                        }
                    });
                        }
                    if (channel.IsPrivate && req.user.id == channel.owner) {
                        await this.channel.addUserToChannel(tmpUser.username, channel);
                    }
                    else if (!channel.IsPrivate) {
                        await this.channel.addUserToChannel(tmpUser.username, channel);
                    }
                 }
                 res.status(200).json("OK")
                }
        catch (error){
            res.status(400).json("INVALID REQUEST ...")
        } 
    }
    

    @Post('removeUserFromChannel')
    @UseGuards(JwtAuth)
    async removeUserFromChannel(@Req() req: Request & {user : UserDto}, @Body() data: channelParams, @Res() res: Response) : Promise<any> {
        try {
                let tmpUser: UserDto = await this.user.getUserByUsername(data.username)
                let  tmpchannel : channelDto = await this.channel.getChannelByName(data.channelName)
                if ( tmpUser && tmpchannel && tmpchannel.admins.includes(req.user.username) && tmpchannel.users.includes(tmpUser.username))
                    {
                    if (tmpUser.username == tmpchannel.owner && req.user.username == tmpchannel.owner)
                        await this.channel.removeUserFromChannel(tmpUser.username, tmpchannel.id);
                    else if (tmpUser.username != tmpchannel.owner)
                        await this.channel.removeUserFromChannel(tmpUser.username, tmpchannel.id);
                    let check : channelDto = await this.channel.getChannelByName(data.channelName)
                    if (check && !check.users.length)
                        await this.channel.deleteChannel(check.id);
                    console.log(check.users)
                }
                res.status(200).json("OK")
            }
            catch (error) {
                res.status(400).json("KO")
            }
        }
        
        @Post('BanUserFromChannel')
        @UseGuards(JwtAuth)
        async   banUserFromChannel(@Req() req: Request & {user : UserDto}, @Body() data: channelParams, @Res() res: Response) {
            try {
                
                let channelTmp : channelDto = await this.channel.getChannelByName(data.channelName)
                let userTmp : UserDto = await this.user.getUserByUsername(data.username)
                if (channelTmp && userTmp && channelTmp.admins.includes(req.user.id)) {
                    if (userTmp.id == channelTmp.owner && userTmp.id == req.user.id)
                    await this.channel.banUserFromChannel(data.username, data.channelName);
                else if (userTmp.id != channelTmp.owner)
                    await this.channel.banUserFromChannel(data.username, data.channelName);
                res.status(200).json("User banned .")
            }
        } catch (error) {
        res.status(400).json("can't ban user .")
   }
}
    

    @Post('deleteInvite')
    @UseGuards(JwtAuth)
    async deleteInvite(@Req() req: Request & {user : UserDto}, @Body('username') username : string,  @Res() res: Response) : Promise<any> {
        try {
            let tmpUser : UserDto = await this.user.getUserByUsername(username)
            if (!tmpUser) {
                res.status(400).json("user dosen't exist in database ...")
                return 
            }
            let find : InviteDto = await this.invite.getInviteToValidate(tmpUser.id, req.user.id)
            if (find)
                await this.invite.deleteInvite(find.id)
            console.log('deleted ...');
            res.status(200)
        } catch (error) {
            res.status(400)
        }
    }

    @Post('unBanUserFromChannel')
    @UseGuards(JwtAuth)
    async   unBanUserFromChannel(@Req() req: Request & {user : UserDto}, @Body() data: channelParams, @Res() res: Response) {
        try {
            console.log("recieved data ===> : ", data);
            let channelTmp : channelDto = await this.channel.getChannelByName(data.channelName)
            let userTmp : UserDto = await this.user.getUserByUsername(data.username)
            if (channelTmp && userTmp && channelTmp.admins.includes(req.user.username) && channelTmp.bannedUsers.includes(userTmp.username)) {
                await this.channel.unBanUserFromChannel(data.username, data.channelName);
                res.status(200).json("ban removed .")
                return
            }
            res.status(200)
        }
        catch (error) {
            res.status(400).json("can't remove ban .")
        }
    }

    @Post('accepteInvite')
    @UseGuards(JwtAuth)
    async accepteInvite(@Req() req: Request & {user : UserDto}, @Body('username') username : string, @Res() res: Response) : Promise<any> {
        try {
            // console.log('this is my invite : ', invite);
            console.log('at least got here ??');
            
            let tmpUser : UserDto = await (await this.user.getUserByUsername(username))
            let invitationSenderId : string = tmpUser.id
            let invitationRecieverId : string = req.user.id
            
            let tmp : InviteDto = await this.invite.getInviteToValidate(invitationSenderId, invitationRecieverId);
            console.log("tmp ===> : ",tmp);
            if (!tmp) {
                res.status(400).json("no Invite to accepte")
                return
            }
            console.log("invite ====> ", username);
            await this.invite.deleteInvite(tmp.id);
            let data : FriendDto = await this.friend.createFriend(new FriendDto(invitationRecieverId, invitationSenderId, ''), req.user.id)
            res.status(200).json(data);
        }
        catch (error) {
            res.status(400)
        }
    }
    

    @Post('addAdminToChannel')
    @UseGuards(JwtAuth)
    async   addAdminToChannel(@Req() req : Request & {user : UserDto},  @Body() data: channelParams, @Res() res: Response) {
        try {
            let _user : UserDto = await this.user.getUserByUsername(data.username)
            if (_user)
                await this.channel.assignAdminToChannel(_user, data.channelName);
            res.status(200)
        }   
        catch (error) {
            res.status(400)
        }
    }
    
    
    @Post('removeAdminToChannel')
    @UseGuards(JwtAuth)
    async   removeAdminFromChannel(@Req() req : Request & {user : UserDto},  @Body() data: channelParams, @Res() res: Response) {
        try {
            let channel : channelDto = await this.channel.getChannelByName(data.channelName)
            let userTmp : UserDto = await this.user.getUserByUsername(data.username)
            if (userTmp && channel && channel.admins.includes(req.user.id)) {
                if (channel.owner == userTmp.id && req.user.id == channel.owner)
                await this.channel.removeAdminPrivilageToUser(data.username, data.channelName);
            else if (channel.owner != userTmp.id)
            await this.channel.removeAdminPrivilageToUser(data.username, data.channelName);
        }
        res.status(200)
    }
    catch (error) {
        res.status(400)
    }
}

    @UseGuards(JwtAuth)
    @Post('addPasswordToChannel')
    async addPasswordToChannel(@Body() channleData : channelDto, @Req() req: Request & {user : UserDto}, @Res() res: Response) {
        try {
            let channel : channelDto = await this.channel.getChannelByName(channleData.name)
            if (channel && channel.owner == req.user.id) {
                await this.channel.setPasswordToChannel(channleData.password, channleData.name)
            }
            res.status(200)
        }
        catch (error) {
            res.status(400)
        }
    }
    
    @UseGuards(JwtAuth)
    @Post('removePasswordToChannel')
    async removePasswordToChannel(@Body() data : channelParams , @Req() req: Request & {user : UserDto}, @Res() res: Response) {
        try {
            let channel : channelDto = await this.channel.getChannelByName(data.channelName)
            if (channel && channel.owner == req.user.id) {
                await this.channel.unsetPasswordToChannel(data.channelName)
            }
            res.status(200)
        }
        catch (error) {
            res.status(400)
        }
    }


    @Post('getChannelMessages')
    @UseGuards(JwtAuth)
    async   getChannelMessages(@Body() data : channelParams, @Req() req: Request & {user : UserDto}, @Res() res: Response) : Promise<any>{
        try {
            let endValue : channelMessageDto[] = []
            let check_channel : channelDto = await this.channel.getChannelByName(data.channelName)
            if (check_channel && check_channel.users.includes(req.user.id)) {
                endValue = await this.channel.getChannelMessages(data.channelName)
            }
            res.status(200).json(endValue)
        }
        catch (error) {
            res.status(400)
        }
    }
}