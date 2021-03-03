import { PartialType } from '@nestjs/mapped-types';
import { CreateChatClientDto } from './create-chat-client.dto';

export class UpdateChatClientDto extends PartialType(CreateChatClientDto) {}
