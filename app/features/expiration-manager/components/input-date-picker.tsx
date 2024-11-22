import { useEffect, useState } from "react";
import {
  Card,
  DatePicker,
  Icon,
  Popover,
  Range,
  TextField,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { format } from "date-fns";

type InputDatePickerProps = {
  label?: string;
  value?: string;
  fullWidth?: boolean;
  disableDatesBefore?: Date;
  disableDatesAfter?: Date;
  onSelectDate?: (value: string) => void;
}

export default function InputDatePicker({ label = "", value, fullWidth = false, disableDatesAfter, disableDatesBefore, onSelectDate }: InputDatePickerProps) {

  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date);
  const [{ month, year }, setDate] = useState({
    month: selectedDate.getMonth(),
    year: selectedDate.getFullYear(),
  });
  const formattedValue = format(selectedDate, "yyyy-MM-dd");

  function handleOnClose() {
    setVisible(false);
  }

  function handleMonthChange(month: number, year: number) {
    setDate({ month, year });
  }

  function handleDateSelection(date: Range) {
    setSelectedDate(date.start);
    setVisible(false);
  }

  useEffect(() => {
    if (selectedDate) {
      setDate({
        month: selectedDate.getMonth(),
        year: selectedDate.getFullYear(),
      });

      let value = format(selectedDate, "yyyy-MM-dd");
      onSelectDate && onSelectDate(value);
    }

  }, [selectedDate]);

  return (
    <Popover
      active={visible}
      autofocusTarget="none"
      preferredAlignment="left"
      fullWidth={fullWidth}
      preferInputActivator={false}
      preferredPosition="below"
      preventCloseOnChildOverlayClick
      onClose={handleOnClose}
      activator={
        <TextField
          role="combobox"
          label={label}
          prefix={<Icon source={CalendarIcon} />}
          value={formattedValue}
          onFocus={() => setVisible(true)}
          autoComplete="off"
        />
      }
    >
      <Card roundedAbove="md">
        <DatePicker
          month={month}
          year={year}
          selected={selectedDate}
          onMonthChange={handleMonthChange}
          onChange={handleDateSelection}
          disableDatesBefore={disableDatesBefore}
          disableDatesAfter={disableDatesAfter}
        />
      </Card>
    </Popover>
  );
}
