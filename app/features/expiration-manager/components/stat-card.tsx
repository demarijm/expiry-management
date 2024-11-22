import { BlockStack, Box, Button, Card, Icon, InlineStack, Text,  } from "@shopify/polaris";
import { ArrowLeftIcon } from '@shopify/polaris-icons';
type StatCardProps = {
	title: string;
	value: string | number;
	tone: 'base' | 'subdued' | 'primary' | 'info' | 'success' | 'caution' | 'warning' | 'critical';
	icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
	action?: string;
	actionCallback?: () => void
}

const StatCard = function (props: StatCardProps) {

	const { title, value, tone, icon, action, actionCallback } = props;

	return (
		<Card roundedAbove="md">
			<BlockStack gap="400">
				<InlineStack direction="row" align="space-between">
					<Text as="h2" variant="headingSm">
						{title}
					</Text>

					<Box as="div">
						<Icon source={icon} tone={tone} />
					</Box>
				</InlineStack>

				<BlockStack gap="200">
					<Text variant="headingXl" as="h4">
						{value}
					</Text>
				</BlockStack>

				<InlineStack align="end">
					{action && 
						<Button
							variant="tertiary"
							icon={ArrowLeftIcon}
							onClick={actionCallback} 
						>
							{action}
						</Button>
					}
				</InlineStack>
			</BlockStack>
		</Card>
	);
}

export default StatCard;