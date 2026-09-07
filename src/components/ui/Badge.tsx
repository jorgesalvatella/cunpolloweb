import { cn } from "@/lib/utils";
import type { MenuItemTag } from "@/types/menu";

const tagStyles: Record<MenuItemTag, string> = {
  popular: "bg-gold-500/15 text-gold-300 border-gold-500/25",
  spicy: "bg-red-500/15 text-red-300 border-red-500/25",
  new: "bg-red-500/15 text-red-300 border-red-500/25",
};

export default function Badge({
  tag,
  label,
}: {
  tag: MenuItemTag;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        tagStyles[tag]
      )}
    >
      {label}
    </span>
  );
}
