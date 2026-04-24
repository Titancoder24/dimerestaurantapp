import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";

type Props = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, helper, error, leading, trailing, containerClassName, className, ...rest },
  ref
) {
  return (
    <View className={cn("w-full", containerClassName)}>
      {label ? <Text className="mb-1.5 text-[13px] font-medium text-dime-ink-2">{label}</Text> : null}
      <View
        className={cn(
          "flex-row items-center rounded-xl border bg-white px-3",
          error ? "border-dime-danger" : "border-dime-border",
          "min-h-[48px]"
        )}
      >
        {leading ? <View className="mr-2">{leading}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#8E8E93"
          className={cn("flex-1 py-3 text-[15px] text-dime-ink", className)}
          {...rest}
        />
        {trailing ? <View className="ml-2">{trailing}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1 text-[12px] text-dime-danger">{error}</Text>
      ) : helper ? (
        <Text className="mt-1 text-[12px] text-dime-ink-3">{helper}</Text>
      ) : null}
    </View>
  );
});
