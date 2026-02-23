import { cn } from "@/lib/utils";
import type { MenuItemTag } from "@/types/menu";

const tagStyles: Record<MenuItemTag, string> = {
  popular: "bg-gold-500/10 text-gold-600 border-gold-500/20",
  spicy: "bg-red-500/10 text-red-600 border-red-500/20",
  new: "bg-red-500/10 text-red-600 border-red-500/20",
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
