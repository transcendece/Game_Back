import { Injectable } from '@nestjs/common';
import { MutedUserDto } from 'src/DTOs/User/mutedUser.dto';
import { UserDto } from 'src/DTOs/User/user.dto';
import { channelDto } from 'src/DTOs/channel/channel.dto';
import { channelMessageDto } from 'src/DTOs/channel/channel.messages.dto';
import { PrismaService } from 'src/modules/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { error } from 'console';

@Injectable()
export class ChannelsService {
 constructor(private prisma: PrismaService) {}

 async createChannel(channelData: channelDto , id : string) : Promise<any> {
  try {

    console.log(`the users id ${id}`);
    let tmp : string[] = [id];
    let check : channelDto = await this.getChannelByName(channelData.name)
    let tmpUser : UserDto = await this.prisma.user.findUnique({where : {id : id}})
    let users : string[] = [tmpUser.username];
    if (check || !tmpUser) {
      return `couldn't creat channel`
    }
    console.log(channelData);
    if (channelData.name ) {
      let _tmp : string[] = ['','']
      if (channelData.IsProtected) {
        _tmp  = await this.hashPassword(channelData.password)
      } 
      else {
        _tmp[0] = ''
        _tmp[1] = ''
      }
      console.log("ahahahaahahh", _tmp);
    let channel: channelDto = await this.prisma.channel.create({data : {
        name : channelData.name,
        admins : users,
        users : users,
        owner : tmpUser.id,
        IsPrivate : channelData.IsPrivate,
        IsProtected : channelData.IsProtected,
        password : _tmp[1],
        passwordHash : _tmp[0]
      }})
    tmpUser.channels.push(channel.name);
    await this.prisma.user.update({
        where: { id: id },
         data: { channels: tmpUser.channels },
    });
  return channel;
}
else
return 'wrong data'
}
catch (error) {
  console.log(error);
}
 }

  async hashPassword(password: string): Promise<string[]> {
    const salt : string = await bcrypt.genSalt();
    let tmp : string[] = []
    tmp.push(salt);
    console.log("hash : ", salt);
    
    let pass : string = await bcrypt.hash(password, salt);
    tmp.push(pass)
    console.log("pass : ", pass);
    return tmp
  }

  async checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

 async  muteUser(id : string, channel: string) : Promise<any> {
  try {

    const now : Date = new Date();
    let channelData : channelDto = await this.prisma.channel.findFirst({where : {
      name : channel
    }})
    if (!channelData || channelData.mutedUsersId.includes(id)) 
      return null;
    let mute : boolean = await this.isMuted(id, channel)
    if (mute)
      return null
    let tmp : string[] = channelData.mutedUsersId
    tmp.push(id)
    let check : MutedUserDto = await this.prisma.mutedUser.create({
      data : {
        userId : id,
        channelId : channelData.id,
        until : new Date(now.getTime() + 1 * 60 * 1000)
      }
    })
    console.log("muted User : ", check);
    await this.prisma.channel.update({where : {id : channelData.id}, data : {mutedUsersId : tmp,}})
  }
  catch (error) {
    console.log(error);
  }
}


  async isMuted(id : string, channel : string) : Promise<boolean> {
    try {
      const now : Date = new Date();
      const tmp : MutedUserDto = await this.prisma.mutedUser.findFirst({
        where: {
          userId: id,
          channelId: channel,
        },
      });
      console.log("--------***>>", tmp);
      if (tmp) {
        console.log("ban duration : ", tmp.until, " current time : ", now);
        if (tmp.until > now) {
          return true;
        }
        else {
            await this.unMuteUser(id, channel);
          }
        }
        else {
          await this.unMuteUser(id, channel);
      }
      return false;
    }catch (error) {
      console.log(error);
    }
 }

 async unMuteUser(id: string, channel: string)   :Promise<any> {
  let channelData : channelDto = await this.prisma.channel.findFirst({where: {
    id : channel,
  }})
  console.log("recieved Id : ", id, "recieverd channel name : " , channel);
  console.log("channel fetched data : ", channelData);
  
  if (channelData) {
    console.log("444444444444");
    let users : string[] = channelData.mutedUsersId
    let index : number = users.indexOf(id)
    if (index != -1)
      users.splice(index, 1)
    await this.prisma.channel.update({where : {id : channelData.id}, data : {mutedUsersId : users}})
    console.log("updated : ===> ", users);
    let tmp : MutedUserDto = await this.prisma.mutedUser.findFirst({where : {
      userId : id,
      channelId : channel
    }})
    if (tmp) {
      await this.prisma.mutedUser.delete({where : {id : tmp.id}})
      console.log("deleted : ===> ", tmp);
      
    }
  }
 }

  async createChannelMessage(message : channelMessageDto) : Promise<any> {
   console.log('message recieved in channel : ',message);
   if (message) {
     console.log('creating channel message', message);
     return this.prisma.channelMessage.create({data : {
       sender : message.sender,
       content : message.content,
       channelName : message.channelName,
     }})
   }
  }

  async getUserChannels(id : string) : Promise<channelDto[]> {
   return await this.prisma.channel.findMany({where : {
     users : {
       has : id,
     }
   }})
  }


  async getChannelSettingsData(id : string) : Promise<channelDto[]>{
   return await this.prisma.channel.findMany({where : {
     admins : {
       has : id,
     }
   }})
  }

 async addUserToChannel(userId: string, _channel : channelDto) : Promise<any>{
  try {

    const user = await this.prisma.user.findFirst({ where: { username: userId } });
    const channel = await this.prisma.channel.findUnique({ where: { id: _channel.id } });
    let tmp : string[] = [];
    let userChannels : string[] = [];
    if (user && channel && !tmp.includes(userId) && !channel.bannedUsers.includes(userId)) {
      tmp  = channel.users;
      userChannels  = user.channels;
      userChannels.push(_channel.name);
      tmp.push(userId);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { channels: userChannels },
      });
      return await this.prisma.channel.update({
        where : {id : _channel.id},
        data : {users : tmp},
      })
    }
  }
  catch (error) {
    console.log(`no such user or channel`);
    return 'error'
  }
 }

 async removeUserFromChannel(userId: string, channelId: string) : Promise<any>{
  try {
    console.log('adam : ', userId, channelId);
    
    const user = await this.prisma.user.findFirst({ where: { username: userId } });
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    let tmpUser : string[] = [];
    let tmpChannel : string[] = [];
    let adminChannel: string[] = [];
    
    if (user && channel && channel.users.includes(userId)) {
      for (let index: number = 0; index < user.channels.length ; index++) {
        if (user.channels[index] != channelId)
        tmpUser.push(user.channels[index])
    }
    for (let index: number = 0; index < channel.users.length ; index++) {
      if (channel.users[index] != userId)
      tmpChannel.push(channel.users[index])
  }
  console.log("channel Admins : ", channel.admins);
  
  if (channel.admins.includes(userId)) {
    for (let index: number = 0; index < channel.admins.length ; index++) {
      console.log("<><><><><><><><><> ", index, channel.admins[index]);
      if (channel.admins[index] != userId)
        adminChannel.push(channel.admins[index])
  }
  if (adminChannel.length == 0)
  adminChannel = [];
await this.prisma.channel.update({
  where : {id : channelId},
  data : {admins : adminChannel},
})
}
  if (tmpUser.length == 0) {
    tmpUser = []
  }
  if (tmpChannel.length == 0) {
    tmpChannel = []
  }
  await this.prisma.user.update({
    where: { id: user.id },
    data : {channels : tmpUser},    
  },
  );
  await this.prisma.channel.update({
    where : {id : channelId},
    data : {users : tmpChannel},
  })
  }
    }
    catch {error} {
      console.log("error: //////////////////////////////////////////////////////////////////", error);
    }
  }
 async banUserFromChannel(username: string, channelName: string) : Promise<any> {
    const user : UserDto = await this.prisma.user.findFirst({ where: { username: username } });
    const channel : channelDto = await this.prisma.channel.findUnique({ where: { name: channelName } });
    let Ban : string[];
    console.log(channel);
    
    if (user && channel && !channel.bannedUsers.includes(user.id)) {
      Ban = channel.bannedUsers;
      await this.removeUserFromChannel(user.id, channel.id);
      Ban.push(user.id);
      console.log(Ban);
      return await this.prisma.channel.update({
        where: { id: channel.id },
        data: { bannedUsers: Ban } },
      );
    }
 }

 async unBanUserFromChannel(username : string, channelName : string) : Promise<any> {
  try {

    console.log('got here .....');
    let user : UserDto = await this.prisma.user.findFirst({where : {username : username}})
    let channel : channelDto = await this.prisma.channel.findUnique({where : {name : channelName}})
    let tmp : string[] = [];
    let _return : channelDto 
    if (user && channel) {
      if (channel.bannedUsers.includes(user.username)) {
        for (let index = 0; index < channel.bannedUsers.length; index++) {
          if (user.username != channel.bannedUsers[index])
          tmp.push(channel.bannedUsers[index]);
      }
      console.log(tmp);
      _return  = await this.prisma.channel.update({where : {id : channel.id},
        data : {bannedUsers : tmp}})
      }
      await this.addUserToChannel(user.username, channel);
      return _return
    }
  }
  catch (error) {
    console.log('failed to unbanned user');
    
  }
 }

 async getChannelByName(channelName: string) : Promise<channelDto> {
    return await this.prisma.channel.findFirst({where : {name : channelName}});
 }
 async assignAdminToChannel(user: UserDto, channelName: string) : Promise<any> {
    // const user = await this.prisma.user.findFirst({ where: { username: userName } });
    const channel = await this.prisma.channel.findUnique({ where: { name: channelName } });
    if (user && channel && channel.users.includes(user.id) && !channel.admins.includes(user.id)) {
      console.log('ghehehe');
      
      channel.admins.push(user.id)
        return await this.prisma.channel.update({where : {id : channel.id},
          data : {
            admins : channel.admins,
          }})
    }
 }

 async removeAdminPrivilageToUser(username : string, channelName : string) : Promise<any> {
    let channel : channelDto = await this.getChannelByName(channelName);
    let user : UserDto = await this.prisma.user.findFirst({where : {username : username}})
    let tmp : string[] = []

    if (user && channel) {
      if (channel.admins.includes(user.id) && user.id != channel.owner)
      {
        for (let index = 0; index < channel.admins.length; index++) {
          if (user.id != channel.admins[index])
            tmp.push(channel.admins[index])
        }
        return await this.prisma.channel.update({where : {id : channel.id} , 
        data : {admins : tmp}})
      }
    }
 }

 async deleteChannel(channelId : string) : Promise<any> {
    await this.prisma.channel.delete({where : {id : channelId}})
 }
 
 
 async setPasswordToChannel(password: string, channelName : string) {
  console.log('testing', password);
  
    let channel : channelDto = await this.getChannelByName(channelName)
    if (channel && password.length) {
      return await this.prisma.channel.update({where : {id: channel.id},
      data : {
        IsProtected : true,
        password : password,
      }})
    }
 }
 
 async unsetPasswordToChannel(channelName : string) {
    let channel : channelDto = await this.getChannelByName(channelName)
    if (channel) {
      return await this.prisma.channel.update({where : {id: channel.id},
      data : {
        IsProtected : false,
        password : '',
      }})
    }
 }
 
 async BanUser(user: UserDto, ban : UserDto): Promise<string> {
    let tmp : string[] = []
    if (user && ban) {
      tmp = user.bandUsers;
      tmp.push(ban.id)
      
      let check = await this.prisma.user.update({where : {id : user.id}, 
        data : {bandUsers : tmp},
      })
      console.log(check);
      return `user banned succesfully.`
    }
    return `user already banned or dosen't exist.`
}
 
async unBanUser(user: UserDto, ban : UserDto): Promise<string> {
    let tmp : string[] = []
    if (user && ban) {
      user.bandUsers.forEach((user) => {
        if (user != ban.id)
          tmp.push(user)
      })
      let check = await this.prisma.user.update({where : {id : user.id}, 
        data : {bandUsers : tmp},
      })
      console.log(check);
      return `user unbanned succesfully.`
    }
    return `user is not in the ban list.`
}

 async getChannelMessages(channel : string) : Promise<channelMessageDto[]> {
  console.log('getting messages of : ',channel);
  
  let tmp =  await this.prisma.channelMessage.findMany({where : {channelName : channel}})
  console.log(tmp);
  return tmp
 }
 }
