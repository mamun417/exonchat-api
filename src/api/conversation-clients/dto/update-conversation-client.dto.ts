import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationClientDto } from './create-conversation-client.dto';

export class UpdateConversationClientDto extends PartialType(CreateConversationClientDto) {}
