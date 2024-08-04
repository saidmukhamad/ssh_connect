import React, { useState, useEffect, ForwardedRef } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, value: externalValue, onValueChange, onValueCommit, ...props }, ref: ForwardedRef<React.ElementRef<typeof SliderPrimitive.Root>>) => {
    const [value, setValue] = useState<number[]>(externalValue || [0, 0]);
    const [committedValue, setCommittedValue] = useState<number[]>(externalValue || [0, 0]);

    useEffect(() => {
      if (externalValue) {
        setValue(externalValue);
        setCommittedValue(externalValue);
      }
    }, [externalValue]);

    const handleValueCommit = (vals: number[]) => {
      setCommittedValue(vals);
      if (onValueCommit) {
        onValueCommit(vals);
      }
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        value={value}
        onValueChange={(newValue: number[]) => {
          setValue(newValue);
          if (onValueChange) {
            onValueChange(newValue);
          }
        }}
        onValueCommit={handleValueCommit}
        onPointerLeave={(e) => {
          if (props.onPointerLeave) props.onPointerLeave(e);

          if (committedValue[0] !== value[0] || committedValue[1] !== value[1]) {
            handleValueCommit(value);
          }
        }}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
);

const default_min_value = 1;
const default_max_value = 30;

/**
 * Slider with range on it
 */
function SliderInput({ setState, min, max, value }: { setState: (v: number) => void; value: number; min?: number; max?: number; children?: React.ReactNode }) {
  min = min ?? 1;
  max = max ?? 30;

  const handle = async (v: number[]) => {
    setState(v[0]);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col w-full space-y-2">
        <div className="flex w-full justify-between">
          <p className="font-light text-xs">{default_min_value}</p>
          <p className="font-light text-xs">{default_max_value}</p>
        </div>
        <Slider value={[value]} defaultValue={[default_min_value]} min={default_min_value} step={1} max={default_max_value} onValueChange={handle} />
      </div>
    </div>
  );
}

type SliderInputComponentProps = { text: string; value: number; setState: (q: number) => void; className?: HTMLDivElement["className"] };

/**
 * Slider with Input About it
 */
function SliderInputComponent({ value, setState, text, className }: SliderInputComponentProps) {
  const [innerState, setInnerState] = React.useState(value);
  React.useEffect(() => setInnerState(value), [value]);

  const handle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setInnerState(parseInt(e.target.value));
  };
  const blurEvt = () => {
    const innnerState_ = Math.abs(innerState);

    isNaN(innnerState_)
      ? setState(1)
      : innnerState_ > default_max_value
      ? (() => {
          setInnerState(30);
          setState(30);
        })()
      : innnerState_ <= 1
      ? setState(1)
      : setState(innnerState_);
  };

  return (
    <div className={cn("", className)}>
      <div className="flex justify-between">
        <Label>{text}</Label>
        <Input className="h-4" onBlur={blurEvt} variant={"ghost_number"} value={innerState} onChange={handle} type="number" />
      </div>

      <SliderInput value={value} setState={setState} />
    </div>
  );
}

export { default_min_value, default_max_value };
export { Slider, SliderInputComponent, SliderInput };
