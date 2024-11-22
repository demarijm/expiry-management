import {
	Box,
	Card,
	Layout,
	Page,
	Text,
	BlockStack,
	InlineGrid,
	TextField,
	Select,
} from "@shopify/polaris";
import { authenticate } from "app/shopify.server";
import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";
import { getSettings, saveSettings, SettingPayload } from "app/services/settings.server";

export const loader: LoaderFunction = async ({ request }) => {
	const { session } = await authenticate.admin(request);

	const settings = await getSettings(session.shop);

	return json({
		settings
	});
};

export const action: ActionFunction = async function({ request }) {
	const { session } = await authenticate.admin(request);

	try {
	  const formData = await request.formData();
  
	  const payload = {
		warningPeriod: Number(formData.get("warningPeriod")) || 50,
	  };
  
	  const response = await saveSettings(session.shop, payload);
	  return response;
	} catch (error) {
	  return null;
	}
}

export default function SettingsPage() {

	const { settings } = useLoaderData<typeof loader>();

	const initialData: SettingPayload = {
		warningPeriod: 7,
	};

	if (settings) {
		initialData.warningPeriod = settings.warningPeriod;
	}

	const [formState, setFormState] = useState<SettingPayload>(initialData);
	const [cleanFormState, setCleanFormState] = useState<SettingPayload>(initialData);
	const [selectedPeriod, setSelectedPeriod] = useState(settings ? String(settings.warningPeriod) : "7");
	const [customDay, setCustomDay] = useState("");

	const navigation = useNavigation();
	const submit = useSubmit();

	const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);
	const isSaving = navigation.state === "submitting";

	const selectOptions = [
		{ label: "1 Week", value: "7" },
		{ label: "2 Weeks", value: "14" },
		{ label: "1 Month", value: "30" },
		{ label: "Custom Number", value: "custom" },
	];

	const handleSelectChange = useCallback(
		(value: string) => {
			setSelectedPeriod(value)

			if(value !== 'custom') {
				setFormState({
					...formState,
					warningPeriod: Number(value)
				});
				setCustomDay("");
			} else {
				setFormState(initialData);
			}
		},
		[],
	);

	function onChangeCustomDay(value: string) {
		setCustomDay(value);

		if(value) {
			setFormState({
				...formState,
				warningPeriod: Number(value)
			});
		} else {
			setFormState(initialData);
		}
	}

	function handleSave() {
		const data: SettingPayload = {
			warningPeriod: formState.warningPeriod
		};

		setCleanFormState({ ...formState });
		submit(data, { method: "POST" });
	}

	return (
		<Page
			narrowWidth
			title="Settings"
			primaryAction={{
				content: "Save",
				loading: isSaving,
				disabled: !isDirty || isSaving,
				onAction: handleSave,
			}}
		>
			<Layout>
				<Layout.Section>
					<BlockStack gap={{ xs: "800", sm: "400" }}>
						<InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
							<Box
								as="section"
								paddingInlineStart={{ xs: "400", sm: "0" }}
								paddingInlineEnd={{ xs: "400", sm: "0" }}
							>
								<BlockStack gap="400">
									<Text as="h3" variant="headingMd">
										App settings
									</Text>
									<Text as="p" variant="bodyMd">
										Settings related to product expiration date.
									</Text>
								</BlockStack>
							</Box>
							<Card roundedAbove="sm">
								<BlockStack gap="400">
									<Select
										label="Set default warning period"
										options={selectOptions}
										onChange={handleSelectChange}
										value={selectedPeriod}
									/>

									{selectedPeriod === 'custom' && <TextField 
										type="number"
										label=""
										placeholder="Enter number of days"
										value={customDay}
										onChange={onChangeCustomDay}
										autoComplete=""
									/>}
									
								</BlockStack>
							</Card>
						</InlineGrid>
					</BlockStack>
				</Layout.Section>
			</Layout>
		</Page>
	);
}
