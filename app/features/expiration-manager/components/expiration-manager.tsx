import { useSubmit } from "@remix-run/react";
import {
	Card,
	DatePicker,
	Button,
	BlockStack,
	Popover,
	TextField,
	PopoverCloseSource,
	InlineStack,
} from "@shopify/polaris";
import {SaveIcon} from '@shopify/polaris-icons';
import { CalendarIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";


export const ExpirationManager = ({ productId, value }: { productId: string, value: string }) => {

	const submit = useSubmit();

	const [visible, setVisible] = useState(false);
	const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
	const [{ month, year }, setDate] = useState({
		month: selectedDate.getMonth(),
		year: selectedDate.getFullYear(),
	});
	const [formattedValue, setFormattedValue] = useState("");
	const datePickerRef = useRef(null);

	function nodeContainsDescendant(rootNode: any, descendant: any) {
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

	function isNodeWithinPopover(node: any) {
		return datePickerRef?.current
			? nodeContainsDescendant(datePickerRef.current, node)
			: false;
	}

	function handleInputValueChange() {
		console.log("handleInputValueChange");
	}

	function handleOnClose(src: PopoverCloseSource) {
		setSelectedDate(value ? new Date(value) : new Date());
		setVisible(false);
	}

	function handleMonthChange(month: number, year: number) {
		setDate({ month, year });
	}

	function handleDateSelection({ end: newSelectedDate }: any) {
		setSelectedDate(newSelectedDate);
		// setVisible(false);
	}

	async function saveExpirationDate(id: string, date: Date) {

		const productId = id;
		const expirationDate = date.toISOString().split('T')[0];
	
		const data = {
			productId,
			expirationDate,
			action: "saveProduct"
		}
	
		submit(data, { method: "POST" });

		setVisible(false);
	}

	useEffect(() => {
		if (selectedDate) {
			setDate({
				month: selectedDate.getMonth(),
				year: selectedDate.getFullYear(),
			});

			setFormattedValue(selectedDate.toISOString().split('T')[0])
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
			<div ref={datePickerRef}>
				<Card roundedAbove="sm">
					<BlockStack gap="500">
						<BlockStack gap="200">
							<DatePicker
								month={month}
								year={year}
								selected={selectedDate}
								onMonthChange={handleMonthChange}
								onChange={handleDateSelection}
							/>
						</BlockStack>

						<InlineStack align="end">
							<Button variant="primary" icon={SaveIcon} onClick={() => saveExpirationDate(productId, selectedDate)}>
								Save Expiration Date
							</Button>
						</InlineStack>
					</BlockStack>
				</Card>
			</div>
		</Popover>
	);
};
