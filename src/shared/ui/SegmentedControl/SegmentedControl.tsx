"use client";

import styled from "styled-components";

interface Tab<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    tabs: Tab<T>[];
    value: T;
    onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
    tabs,
    value,
    onChange,
}: SegmentedControlProps<T>) {
    return (
        <Container>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.value}
                    $active={tab.value === value}
                    onClick={() => onChange(tab.value)}
                >
                    {tab.label}
                </TabButton>
            ))}
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    height: 40px;
    padding: 2px;
    border-radius: 10px;
    background-color: var(--color-semantic-fill-normal);
    width: 100%;
`;

const TabButton = styled.button<{ $active: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    border-radius: ${({ $active }) => ($active ? "8px" : "0")};
    background-color: ${({ $active }) =>
        $active ? "var(--color-semantic-background-elevated-normal)" : "transparent"};
    box-shadow: ${({ $active }) =>
        $active ? "0px 0px 4px 0px rgb(from var(--color-semantic-static-black) r g b / var(--color-atomic-opacity-8))" : "none"};
    color: ${({ $active }) =>
        $active
            ? "var(--color-semantic-label-normal)"
            : "var(--color-semantic-label-alternative)"};
    font-size: var(--typography-body-2-normal-font-size);
    font-weight: 500;
    line-height: var(--typography-body-2-normal-line-height);
    letter-spacing: var(--typography-body-2-normal-letter-spacing);
    transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
`;
