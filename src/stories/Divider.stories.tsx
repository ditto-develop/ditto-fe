import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "../components/common/Divider";

const meta: Meta<typeof Divider> = {
    title: "Components/Divider",
    component: Divider,
    tags: ["autodocs"],
    argTypes: {
        $variant: {
            control: "select",
            options: ["normal", "strong", "thick"],
        },
        $orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
    args: {
        $orientation: "horizontal",
        $variant: "normal",
    },
    decorators: [
        (Story) => (
            <div style={{ width: "300px", padding: "20px" }}>
                <Story />
            </div>
        ),
    ],
};

export const Thick: Story = {
    args: {
        $orientation: "horizontal",
        $variant: "thick",
    },
};

export const Vertical: Story = {
    args: {
        $orientation: "vertical",
        $variant: "normal",
    },
    decorators: [
        (Story) => (
            <div style={{ height: "100px", display: "flex", alignItems: "center", padding: "20px" }}>
                <span>Left</span>
                <Story />
                <span>Right</span>
            </div>
        ),
    ],
};
