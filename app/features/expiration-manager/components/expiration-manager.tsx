import {
	Card,
	DatePicker,
	Button,
	FormLayout,
	BlockStack,
	Box,
	Icon,
	Popover,
	TextField,
} from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import { CalendarIcon } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";

async function saveExpirationDate(productId, expirationDate) {
	// Make an API call to save expiration date in your backend
}
export const ExpirationManager = ({ productId }) => {
	function nodeContainsDescendant(rootNode, descendant) {
		if (rootNode === descendant) {
			return true;
		}
		let parent = descendant.parentNode;
		while (parent != null) {
			if (parent === rootNode) {
				return true;
			}
			parent = parent.parentNode;
		}
		return false;
	}
	const [visible, setVisible] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [{ month, year }, setDate] = useState({
		month: selectedDate.getMonth(),
		year: selectedDate.getFullYear(),
	});
	const formattedValue = selectedDate.toISOString().slice(0, 10);
	const datePickerRef = useRef(null);
	function isNodeWithinPopover(node) {
		return datePickerRef?.current
			? nodeContainsDescendant(datePickerRef.current, node)
			: false;
	}
	function handleInputValueChange() {
		console.log("handleInputValueChange");
	}
	function handleOnClose({ relatedTarget }) {
		setVisible(false);
	}
	function handleMonthChange(month, year) {
		setDate({ month, year });
	}
	function handleDateSelection({ end: newSelectedDate }) {
		setSelectedDate(newSelectedDate);
		setVisible(false);
	}
	useEffect(() => {
		if (selectedDate) {
			setDate({
				month: selectedDate.getMonth(),
				year: selectedDate.getFullYear(),
			});
		}
	}, [selectedDate]);
	return (
		<Popover
			active={visible}
			autofocusTarget="none"
			preferredAlignment="left"
			preferInputActivator={false}
			preferredPosition="below"
			preventCloseOnChildOverlayClick
			onClose={handleOnClose}
			activator={
				<TextField
					role="combobox"
					label=""
					prefix={<CalendarIcon size={16} />}
					value={formattedValue}
					size="slim"
					onFocus={() => setVisible(true)}
					onChange={handleInputValueChange}
					autoComplete="off"
				/>
			}
		>
			<Card ref={datePickerRef}>
				<DatePicker
					month={month}
					year={year}
					selected={selectedDate}
					onMonthChange={handleMonthChange}
					onChange={handleDateSelection}
				/>
				<Button onClick={() => saveExpirationDate(productId, selectedDate)}>
					Save Expiration Date
				</Button>
			</Card>
		</Popover>
	);
};
