import {
  Apple,
  Cherry,
  Carrot,
  Cookie,
  Croissant,
  Egg,
  Milk,
  Pizza,
  Cake,
  Coffee,
  Beef,
  Fish,
  Banana,
  Grape,
  Salad,
  Sandwich,
  IceCreamCone,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react"

type AnimationType =
  | "float"
  | "float-reverse"
  | "drift"
  | "drift-reverse"
  | "spin"
  | "spin-reverse"
  | "float-spin"
  | "pulse-float"

interface FoodIcon {
  Icon: LucideIcon
  size: number
  top: string
  left: string
  opacity: number
  animation: AnimationType
  duration: number
  delay: number
}

const foodIcons: FoodIcon[] = [
  { Icon: Apple, size: 48, top: "8%", left: "5%", opacity: 0.3, animation: "float", duration: 7, delay: 0 },
  { Icon: Pizza, size: 64, top: "15%", left: "85%", opacity: 0.25, animation: "float-spin", duration: 12, delay: 1 },
  { Icon: ShoppingCart, size: 56, top: "25%", left: "12%", opacity: 0.22, animation: "drift", duration: 15, delay: 2 },
  { Icon: Coffee, size: 40, top: "5%", left: "45%", opacity: 0.28, animation: "float-reverse", duration: 8, delay: 0.5 },
  { Icon: Carrot, size: 44, top: "35%", left: "78%", opacity: 0.26, animation: "float", duration: 9, delay: 1.5 },
  { Icon: Croissant, size: 52, top: "55%", left: "8%", opacity: 0.24, animation: "pulse-float", duration: 10, delay: 0 },
  { Icon: Milk, size: 48, top: "70%", left: "88%", opacity: 0.28, animation: "float-reverse", duration: 11, delay: 2.5 },
  { Icon: Cherry, size: 36, top: "18%", left: "32%", opacity: 0.32, animation: "spin", duration: 20, delay: 0 },
  { Icon: Cake, size: 56, top: "45%", left: "92%", opacity: 0.2, animation: "drift-reverse", duration: 14, delay: 3 },
  { Icon: Cookie, size: 32, top: "62%", left: "25%", opacity: 0.3, animation: "float-spin", duration: 13, delay: 1 },
  { Icon: Egg, size: 40, top: "80%", left: "45%", opacity: 0.25, animation: "float", duration: 7.5, delay: 0.5 },
  { Icon: Beef, size: 44, top: "12%", left: "68%", opacity: 0.27, animation: "drift", duration: 16, delay: 2 },
  { Icon: Fish, size: 48, top: "75%", left: "15%", opacity: 0.22, animation: "float-reverse", duration: 9.5, delay: 1.5 },
  { Icon: Banana, size: 38, top: "40%", left: "55%", opacity: 0.28, animation: "spin-reverse", duration: 18, delay: 0 },
  { Icon: Grape, size: 42, top: "88%", left: "72%", opacity: 0.26, animation: "pulse-float", duration: 8.5, delay: 2 },
  { Icon: Salad, size: 50, top: "28%", left: "42%", opacity: 0.2, animation: "drift-reverse", duration: 17, delay: 1 },
  { Icon: Sandwich, size: 46, top: "58%", left: "65%", opacity: 0.24, animation: "float", duration: 10.5, delay: 0.5 },
  { Icon: IceCreamCone, size: 44, top: "85%", left: "35%", opacity: 0.28, animation: "float-spin", duration: 11.5, delay: 3 },
]

export function AnimatedFoodBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        background: "linear-gradient(135deg, #ff7a3c 0%, #ff9f1c 50%, #ffd166 100%)",
        zIndex: 0,
      }}
    >
      {foodIcons.map((item, index) => {
        const { Icon, size, top, left, opacity, animation, duration, delay } = item
        return (
          <div
            key={index}
            className="absolute"
            style={{
              top,
              left,
              opacity,
              animation: `${animation} ${duration}s ease-in-out ${delay}s infinite`,
            }}
          >
            <Icon size={size} strokeWidth={1.5} className="text-white" />
          </div>
        )
      })}
    </div>
  )
}
