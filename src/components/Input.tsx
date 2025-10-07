import React, { InputHTMLAttributes } from 'react';
import styled from 'styled-components';


const Inputbg = styled.input`
    background-image: url('/button.svg');
    width: 305px;
    height: 59px;
    padding: 16px;
`

type inputType = InputHTMLAttributes<HTMLInputElement>;

export function Input({...props}:inputType) {
  return (
    <>
        <Inputbg 
            {...props}
        />
    </>
  )
}

const HiddenCheckbox = styled.input`
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    cursor: pointer;
`;

const StyledLabel = styled.label`
    display: inline-block;
    width: 24px;
    height: 24px;
    background-image: url('/icons/nochecked.svg');
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
`;

const CheckedBoxContainer = styled.div`
    display: inline-block;
    position: relative;

    ${HiddenCheckbox}:checked + ${StyledLabel} {
        border: none;
        background-position: center;
        background-repeat: no-repeat;
        width: 24px;
        height: 24px;
        background-image: url('/icons/checked.svg');
    }
`;


type checkboxType = InputHTMLAttributes<HTMLInputElement> & {
    ischecked: boolean,
    setIschecked: (arg0: boolean) => void
}
export function Checkbox({ischecked,setIschecked,...props}:checkboxType) {
  return (
    <>
        <CheckedBoxContainer>
            <HiddenCheckbox 
                {...props}
                checked={ischecked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{setIschecked(e.target.checked)}}
                id="custom-checkbox"
                type="checkbox"
            />
            <StyledLabel htmlFor="custom-checkbox" />
        </CheckedBoxContainer>
    </>
  )
}
