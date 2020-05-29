import {useState} from 'react';

export const useForceupdate = () => {
  const [counter, setCounter] = useState(0);

  const forceUpdate = () => {
    setCounter(counter + 1);
  };

  return {
    forceUpdate
  };
};
