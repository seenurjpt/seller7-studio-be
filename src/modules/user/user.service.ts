import { z } from 'zod';
import { User, IUserDocument } from '../../models/user.model';
import { ApiError } from '../../utils/ApiError';
import { SafeUser } from '../../types/auth.types';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
});

function toSafeUser(user: IUserDocument): SafeUser {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: (user as unknown as { createdAt: Date }).createdAt,
    updatedAt: (user as unknown as { updatedAt: Date }).updatedAt,
  };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return toSafeUser(user);
}

export async function updateProfile(
  userId: string,
  updates: z.infer<typeof updateProfileSchema>,
): Promise<SafeUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');
  return toSafeUser(user);
}
