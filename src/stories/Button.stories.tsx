import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../components/common/Button";

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    tags: ["autodocs"],
    argTypes: {
        $variant: {
            control: "select",
            options: ["solid", "outlined", "text"],
            description: "Button style variant",
            table: { defaultValue: { summary: "solid" } },
        },
        $theme: {
            control: "select",
            options: ["primary", "secondary", "assistive"],
            description: "Color theme",
            table: { defaultValue: { summary: "primary" } },
        },
        $size: {
            control: "select",
            options: ["large", "medium", "small"],
            description: "Size of the button",
            table: { defaultValue: { summary: "medium" } },
        },
        $iconOnly: {
            control: "boolean",
            description: "Whether the button contains only an icon",
        },
        disabled: {
            control: "boolean",
            description: "Disabled state",
        },
        onClick: { action: "clicked" },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const PrimarySolid: Story = {
    args: {
        children: "Primary Button",
        $variant: "solid",
        $theme: "primary",
        $size: "large",
    },
};

export const SecondarySolid: Story = {
    args: {
        children: "Secondary Button",
        $variant: "solid",
        $theme: "secondary",
        $size: "large",
    },
};

export const Outlined: Story = {
    args: {
        children: "Outlined Button",
        $variant: "outlined",
        $size: "medium",
    },
};

export const Text: Story = {
    args: {
        children: "Text Button",
        $variant: "text",
        $size: "small",
    },
};

export const Disabled: Story = {
    args: {
        children: "Disabled Button",
        $variant: "solid",
        disabled: true,
    },
};

export const IconOnly: Story = {
    args: {
        children: "+",
        $variant: "solid",
        $iconOnly: true,
        $size: "medium",
    },
};
