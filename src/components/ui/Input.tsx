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
      {label ? (
        <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-dime-ink-3">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center rounded-xl border bg-dime-bg-2 px-4",
          error ? "border-dime-danger" : "border-transparent",
          "min-h-[52px]"
        )}
      >
        {leading ? <View className="mr-3">{leading}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor="#8A8A8A"
          className={cn("flex-1 py-3.5 text-[15px] text-dime-ink", className)}
          {...rest}
        />
        {trailing ? <View className="ml-3">{trailing}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1.5 text-[12px] text-dime-danger">{error}</Text>
      ) : helper ? (
        <Text className="mt-1.5 text-[12px] text-dime-ink-3">{helper}</Text>
      ) : null}
    </View>
  );
});
