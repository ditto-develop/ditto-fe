import type { Meta, StoryObj } from "@storybook/react";
import { LayoutPage, Section, Heading, List } from "../components/common/Layout";
import { StatusBar, HomeBar } from "../components/common/Essential";
import { ActionArea, ActionContent, ActionTitle } from "../components/common/ActionArea";
import { Divider } from "../components/common/Divider";

const meta: Meta<typeof LayoutPage> = {
    title: "Components/Layout",
    component: LayoutPage,
    tags: ["autodocs"],
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof LayoutPage>;

export const StandardLayout: Story = {
    render: () => (
        <LayoutPage>
            <StatusBar />
            <Section>
                <Heading>Account Settings</Heading>
                <List>
                    <ActionArea>
                        <ActionContent>
                            <ActionTitle>Profile</ActionTitle>
                        </ActionContent>
                    </ActionArea>
                    <Divider />
                    <ActionArea>
                        <ActionContent>
                            <ActionTitle>Notifications</ActionTitle>
                        </ActionContent>
                    </ActionArea>
                </List>
            </Section>
            <div style={{ flex: 1 }} />
            <HomeBar />
        </LayoutPage>
    ),
};
