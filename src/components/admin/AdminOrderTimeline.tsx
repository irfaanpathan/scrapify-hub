import { Package, Truck, UserCheck, Scale, CreditCard, CheckCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminOrderTimelineProps {
  status: string;
  createdAt: string;
  updatedAt: string;
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
}

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "assigned", label: "Partner Assigned", icon: UserCheck },
  { key: "picked", label: "Scrap Picked", icon: Truck },
  { key: "weighed", label: "Scrap Weighed", icon: Scale },
  { key: "paid", label: "Payment Done", icon: CreditCard },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const AdminOrderTimeline = ({
  status,
  createdAt,
  updatedAt,
  onStatusChange,
  disabled,
}: AdminOrderTimelineProps) => {
  const currentStepIndex = ORDER_STEPS.findIndex((step) => step.key === status);
  const nextStep = ORDER_STEPS[currentStepIndex + 1];

  return (
    <div className="py-4">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div
          className="absolute left-4 top-0 w-0.5 bg-primary transition-all duration-500"
          style={{
            height: `${Math.min(100, ((currentStepIndex + 1) / ORDER_STEPS.length) * 100)}%`,
          }}
        />

        <div className="space-y-5">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-center gap-4 pl-10">
                <div
                  className={cn(
                    "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-success text-success-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                    isPending && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        "font-medium text-sm",
                        isPending ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                        Done
                      </span>
                    )}
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(createdAt).toLocaleString()}
                    </p>
                  )}
                  {isCurrent && index !== 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {isCurrent && nextStep && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    onClick={() => onStatusChange(nextStep.key)}
                  >
                    Mark {nextStep.label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { ORDER_STEPS };
export default AdminOrderTimeline;
