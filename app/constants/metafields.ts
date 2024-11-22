export const Metafields = {
	expiration_date: {
		namespace: "expiration_manager",
		key: "expiration_date",
		value_type: "date",
		description: "The expiration date for the product",
	},
	expiration_warning_date: {
		namespace: "expiration_manager",
		key: "expiration_warning_date",
		value_type: "date",
		description: "Alert users about an item nearing its expiration",
	},
	expiration_status: {
		namespace: "expiration_manager",
		key: "expiration_status",
		value_type: "boolean",
		description: "The status of the expiration date for the product",
	},
};
 