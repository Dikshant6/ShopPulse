import { User } from "../models/User.js";
import bcrypt from "bcrypt";

export const createUser = async (user) => {
  const { username, email, password } = user;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name: username,
    email,
    password: hashedPassword,
  });
  await newUser.save();
  return newUser;
};

export const loginUser = async (user) => {
  const { email, password } = user;

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new Error("User not found");
  }

  const hashedPassword = existingUser.password;
  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (isMatch) {
    return existingUser;
  } else {
    throw new Error("Password doesn't match");
  }
};
