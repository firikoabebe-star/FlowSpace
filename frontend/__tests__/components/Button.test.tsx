import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button Component", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant classes correctly", () => {
    const { rerender } = render(<Button variant="outline">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-gray-300");

    rerender(<Button variant="ghost">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-gray-100");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-3", "py-1.5", "text-sm");

    rerender(<Button size="lg">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-6", "py-3", "text-lg");
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveClass(
      "opacity-50",
      "cursor-not-allowed",
    );
  });

  it("renders loading state correctly", () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Loading Button")).toBeInTheDocument();
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Button</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders as different element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });
});
