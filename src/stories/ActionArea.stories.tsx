import type { Meta, StoryObj } from "@storybook/react";
import { ActionArea, ActionContent, ActionTitle, ActionDescription, ActionExtra } from "../components/common/ActionArea";

const meta: Meta<typeof ActionArea> = {
    title: "Components/ActionArea",
    component: ActionArea,
    tags: ["autodocs"],
    argTypes: {
        $active: { control: "boolean" },
        disabled: { control: "boolean" },
    },
};

export default meta;
type Story = StoryObj<typeof ActionArea>;

export const Default: Story = {
    render: (args) => (
        <ActionArea {...args}>
            <ActionContent>
                <ActionTitle>Action Title</ActionTitle>
                <ActionDescription>Description goes here</ActionDescription>
            </ActionContent>
        </ActionArea>
    ),
};

export const WithIcon: Story = {
    render: (args) => (
        <ActionArea {...args}>
            <div style={{ marginRight: 12 }}>🚀</div>
            <ActionContent>
                <ActionTitle>Feature Launch</ActionTitle>
                <ActionDescription>New features are available</ActionDescription>
            </ActionContent>
        </ActionArea>
    ),
};

export const WithExtraAction: Story = {
    render: (args) => (
        <ActionArea {...args}>
            <ActionContent>
                <ActionTitle>Settings</ActionTitle>
                <ActionDescription>Manage your preferences</ActionDescription>
            </ActionContent>
            <ActionExtra>
                <span>Toggle</span>
            </ActionExtra>
        </ActionArea>
    ),
};
