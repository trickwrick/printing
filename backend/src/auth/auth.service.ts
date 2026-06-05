import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginHistory, LoginHistoryDocument } from '../schemas/login-history.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(LoginHistory.name)
    private readonly loginHistoryModel: Model<LoginHistoryDocument>,
  ) {}

  async signup(name: string, email: string, password: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.userModel.create({ name, email, password });
    return {
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email },
    };
  }

  async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ) {
    const user = await this.userModel.findOne({ email });

    if (!user || user.password !== password) {
      if (user) {
        await this.loginHistoryModel.create({
          userId: user._id,
          email: user.email,
          status: 'failed',
          ip,
          userAgent,
        });
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.loginHistoryModel.create({
      userId: user._id,
      email: user.email,
      status: 'success',
      ip,
      userAgent,
    });

    return {
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
    };
  }

  async getHistory() {
    return this.loginHistoryModel.find().sort({ loginTime: -1 }).limit(100);
  }
}
