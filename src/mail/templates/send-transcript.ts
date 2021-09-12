import * as moment from 'moment';
import * as _l from 'lodash';
import 'moment-precise-range-plugin';

export default function (convWithMessages: any) {
    const client = _l.find(convWithMessages.conversation_sessions, (cv: any) => !cv.socket_session.user);

    convWithMessages.messages.map((message: any) => {
        // console.log({ user });

        message.conversation_session = _l.find(
            convWithMessages.conversation_sessions,
            (cv: any) => cv.socket_session_id === message.socket_session_id,
        );
    });

    const template = `<div style='background-color: rgb(240 240 234); margin-top: 10px;padding: 20px 0; font-family: Arial,Helvetica,sans-serif'>
        <div style='max-width: 600px; background-color: white; margin: auto; color: rgb(84, 77, 68)'>
            <div style='height: 12px; background-color: #40bc3d'></div>
            <div>
                <div style='padding: 20px'>
                    <img
                        src='https://www.exonhost.com/img/logo.png'
                        style='border: 0; display: block; max-height: 52px; max-width: 150px'
                        alt=''
                    />
                </div>
                <div style='text-align: center'>
                    <p style='font-size: 28px; color: rgb(84, 77, 68); margin-bottom: 30px; font-weight: bold'>
                        Chat transcript
                    </p>
                </div>

                <div style='padding: 0 20px 4px'>
                    <div style='margin-bottom: 5px'>
                        <p style='font-size: 12px; color: rgb(109, 104, 98); margin: 0; padding: 0'>
                            <b>Name: </b>${client.socket_session.init_name}
                        </p>
                    </div>
                    <div style='margin-bottom: 5px'>
                        <p style='font-size: 12px; color: rgb(109, 104, 98); margin: 0; padding: 0'>
                            <b>Email: </b>${client.socket_session.init_email}
                        </p>
                    </div>
                    <div style='margin-bottom: 5px'>
                        <p style='font-size: 12px; color: rgb(109, 104, 98); margin: 0; padding: 0'>
                            <b>Chat department: </b>${convWithMessages.chat_department.display_name}
                        </p>
                    </div>
                </div>

                <div style='margin-top: 15px'>
                    ${convWithMessages.messages.map(messageMaker).join('')}

                    ${
                        convWithMessages.conversation_rating
                            ? `<div style='padding: 10px 20px; border-top: 1px solid rgb(221 221 221)'>
                        <div style='display: flex; justify-content: space-between'>
                            <div style='color: rgb(188, 186, 184); font-size: 12px'>
                                You rated our customer service as ${convWithMessages.conversation_rating.rating}
                            </div>
                            <div style='color: rgb(188, 186, 184); font-size: 10px'>${convWithMessages.conversation_rating.created_at}</div>
                        </div>
                    </div>

                    <div
                        style='
                            padding: 10px 20px;
                            border-top: 1px solid rgb(221 221 221);
                            border-bottom: 1px solid rgb(221 221 221);
                        '
                    >
                        <div style='display: flex; justify-content: space-between'>
                            <div style='color: rgb(188, 186, 184); font-size: 12px'>
                                You left the following comment: ${convWithMessages.conversation_rating.comment}
                            </div>
                            <div style='color: rgb(188, 186, 184); font-size: 10px'>${convWithMessages.conversation_rating.created_at}</div>
                        </div>
                    </div>`
                            : ''
                    }
                </div>

                <div style='margin: 10px 0; padding-bottom: 20px'>
                    <div style='padding: 10px 20px; color: rgb(188, 186, 184)'>Duration: ${
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        moment.preciseDiff(
                            convWithMessages.created_at,
                            convWithMessages.closed_at || moment(Date.now()),
                        )
                    }</div>
                    <div style='padding: 10px 20px; color: rgb(188, 186, 184)'>
                        Chat Started on:
                        <a
                            style='text-decoration: none; color: rgb(77, 124, 179)'
                            href='https://www.exonhost.com'
                            target='_blank'
                            >https://www.exonhost.com</a
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    return template;
}

function messageMaker(message) {
    // console.log(message);
    const name = message.conversation_session?.socket_session?.user
        ? message.conversation_session?.socket_session?.user?.user_meta?.display_name
        : message.conversation_session?.socket_session?.init_name;

    return `<div style='background-color: #fafafa; padding: 10px 20px; border-top: 1px solid rgb(221 221 221)'>
        <div style='display: flex; justify-content: space-between; margin-bottom: 5px'>
            <div style='color: rgb(188, 186, 184); font-size: 12px'>${name}</div>
            <div style='color: rgb(188, 186, 184); font-size: 10px'>
                ${moment(message.created_at).format('ddd, D/M/YY h:mm:ss a')}
            </div>
        </div>
        <div>${message.msg}</div>
    </div>`;
}
