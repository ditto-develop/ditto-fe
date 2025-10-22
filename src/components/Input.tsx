import React, { InputHTMLAttributes } from 'react';
import styled from 'styled-components';


const Inputbg = styled.input`
    width: 345px;
    height: 62.8px;
    z-index: 888;
    padding: 16px 16px;
`
const Imgbox = styled.img`
    position: absolute;
    z-index: 0;
    width: 100%;
`;

const Middlebox = styled.div`
    display: flex;
    position: relative;
    width: 345px;
    height: 62.8px;
    align-items:center; 
    justify-content:center;
`;

type inputType = InputHTMLAttributes<HTMLInputElement>;

export function Input({...props}:inputType) {
  return (
    <Middlebox>
        <Inputbg 
            {...props}
        />
        <Imgbox 
            src='/button.svg'
        />
    </Middlebox>
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
