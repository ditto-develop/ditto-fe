"use client";

import styled from "styled-components";

interface Tab<T extends string> {
    value: T;
    label: string;
    /** 라벨 오른쪽 위에 빨간 점을 띄운다. 이 탭에 사용자가 처리할 것이 있다는 표시다. */
    showDot?: boolean;
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
                    <TabLabel>
                        {tab.label}
                        {tab.showDot && (
                            <TabDot
                                data-testid={`segmented-control-dot-${tab.value}`}
                                role="img"
                                aria-label="새 알림"
                            />
                        )}
                    </TabLabel>
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

/* 점이 생기고 사라져도 라벨이 가운데에서 움직이지 않도록 점은 흐름 밖에 둔다. */
const TabLabel = styled.span`
    position: relative;
`;

/* 색은 홈 알림 종의 점(MainHeader AlarmDot)과 같다. */
const TabDot = styled.span`
    position: absolute;
    top: var(--spacing-2px);
    left: 100%;
    margin-left: var(--spacing-2px);
    width: var(--spacing-6px);
    height: var(--spacing-6px);
    border-radius: 50%;
    background-color: var(--color-semantic-status-negative);
`;
