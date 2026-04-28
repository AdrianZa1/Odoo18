/** @odoo-module **/

export const CARD_BRANDS_BY_TYPE = {
    credit: [
        {
            key: "visa",
            label: "Visa",
            image: "/mejoras_restaurant/static/src/img/cards/visa.svg",
            type: "credit",
        },
        {
            key: "mastercard",
            label: "MasterCard",
            image: "/mejoras_restaurant/static/src/img/cards/mastercard.svg",
            type: "credit",
        },
        {
            key: "amex",
            label: "American Express",
            image: "/mejoras_restaurant/static/src/img/cards/amex.svg",
            type: "credit",
        },
        {
            key: "diners",
            label: "Diners Club",
            image: "/mejoras_restaurant/static/src/img/cards/diners.svg",
            type: "credit",
        },
        {
            key: "discover",
            label: "Discover",
            image: "/mejoras_restaurant/static/src/img/cards/discover.svg",
            type: "credit",
        },
        {
            key: "other",
            label: "Otra",
            image: "/mejoras_restaurant/static/src/img/cards/other.svg",
            type: "credit",
        },
    ],
    debit: [
        {
            key: "visa",
            label: "Visa",
            image: "/mejoras_restaurant/static/src/img/cards/visa.svg",
            type: "debit",
        },
        {
            key: "mastercard",
            label: "MasterCard",
            image: "/mejoras_restaurant/static/src/img/cards/mastercard.svg",
            type: "debit",
        },
        {
            key: "other",
            label: "Otra",
            image: "/mejoras_restaurant/static/src/img/cards/other.svg",
            type: "debit",
        },
    ],
};

export function getPaymentCardType(paymentMethod) {
    const name = (paymentMethod?.name || "").toLowerCase();
    if (name.includes("debito") || name.includes("debit")) {
        return "debit";
    }
    return "credit";
}

export function getCardBrandsForType(paymentType) {
    return CARD_BRANDS_BY_TYPE[paymentType] || CARD_BRANDS_BY_TYPE.credit;
}
