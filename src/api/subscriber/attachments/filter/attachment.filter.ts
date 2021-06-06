import { extname } from 'path';
import { PrismaClient } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

const prisma = new PrismaClient();

export const imageFileFilter = (req, file: any, callback: any) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new HttpException('Only image type is allowed', HttpStatus.NOT_ACCEPTABLE), false);
    }

    if (file.size * 1024 > 5) {
        return callback(new HttpException('file size cant be more then 5mb', HttpStatus.NOT_ACCEPTABLE), false);
    }

    callback(null, true);
};

export const editFileName = async (req: any, file: any, callback: any) => {
    const subscriberId = req.user.data.socket_session.subscriber_id;
    const socketSessionId = req.user.data.socket_session.id;

    console.log(file);
    console.log(file.size);

    const name = file.originalname.split('.')[0];
    const fileExtName = extname(file.originalname);

    const attachmentInfo = await prisma.attachment.create({
        data: {
            original_name: file.originalname,
            size: file.size,
            ext: fileExtName,
            folder_path: socketSessionId, // dont use first or last slash. can be made from date month year
            socket_session: { connect: { id: socketSessionId } },
            subscriber: { connect: { id: subscriberId } },
        },
    });

    callback(null, `${attachmentInfo.id}${fileExtName}`);
};
