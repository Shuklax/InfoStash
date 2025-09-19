import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

//used for conditionally applying tailwind classes
//this function first uses clsx to process the inputs, then sends that string to twMerge to clean up any Tailwind conflicts. It returns a single, correct set of classes as the result.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
