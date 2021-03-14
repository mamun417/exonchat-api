import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';

@Controller('roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Get()
    async findAll(): Promise<Role[]> {
        return await this.roleService.findAll();
    }

    @Post()
    async create(@Body() createRoleDto: CreateRoleDto) {
        return await this.roleService.create(createRoleDto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
        return await this.roleService.update(id, updateRoleDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Role> {
        return await this.roleService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.roleService.remove(id);
    }

    @Put('assign/user')
    async roleAssignToUser(@Body() assignRoleToUserDto: AssignRoleToUserDto) {
        return await this.roleService.roleAssignToUser(assignRoleToUserDto);
    }
}
