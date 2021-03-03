import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { ChatClient } from '../../chat-clients/entities/chat-client.entity';

@Entity()
export class ConversationClient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
    })
    conversation_id: string;

    @Column({
        type: 'uuid',
    })
    chat_client_id: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    joined_at: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    leave_at: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at: string;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    updated_at: string;

    @ManyToOne(
        (type) => Conversation,
        (conversation) => conversation.conversation_clients,
    )
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ManyToOne(
        (type) => ChatClient,
        (chat_client) => chat_client.conversation_clients,
    )
    @JoinColumn({ name: 'chat_client_id' })
    chat_client: ChatClient;
}
