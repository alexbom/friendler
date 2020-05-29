import {sModal, sTooltip} from '../services';
import {ValidatorProps} from '../config/types';

interface useValidationProps {
  getValid: () => boolean;
}

export const useValidation = (validators: ValidatorProps[]): useValidationProps => {
  const getValid = () => {
    for (const {input, error, isValid} of validators) {
      if (!isValid) {
        const el = input ? input.current : null;

        if (el) {
          sTooltip.show(error, input.current, null, 'error');
          input.current.focus();
        } else {
          sModal.showAlert(error);
        }

        return false;
      }
    }

    return true;
  };

  return {
    getValid
  };
};
