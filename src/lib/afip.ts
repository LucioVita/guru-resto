export interface AfipConfig {
    tax_id: string;
    token: string;
    environment: 'dev' | 'prod';
    wsid: string;
    cert?: string;
    key?: string;
}

export interface AfipAuthResponse {
    expiration: string;
    token: string;
    sign: string;
}

const BASE_URL = 'https://app.afipsdk.com/api/v1/afip';

export async function getAfipAuth(config: AfipConfig): Promise<AfipAuthResponse> {
    const response = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
            environment: config.environment,
            tax_id: config.tax_id,
            wsid: config.wsid,
            cert: config.cert,
            key: config.key
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AFIP Auth Error: ${error}`);
    }

    return response.json();
}

export async function callAfipWebService(config: AfipConfig, method: string, params: any) {
    const auth = await getAfipAuth(config);

    const response = await fetch(`${BASE_URL}/requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.token}`
        },
        body: JSON.stringify({
            wsid: config.wsid,
            method,
            params,
            token: auth.token,
            sign: auth.sign
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AFIP Request Error: ${error}`);
    }

    return response.json();
}

export async function createElectronicInvoice(
    config: AfipConfig,
    data: {
        puntoVenta: number;
        tipoComprobante: number; // 6 for Factura B, 11 for Factura C
        concepto: number; // 1 for Products
        docTipo: number; // 99 for Final Consumer
        docNro: number;
        impTotal: number;
    }
) {
    // 1. Get Last Voucher Number
    const lastVoucherRes = await callAfipWebService(config, 'FEParamGetTiposCbte', {});
    // Actually, we need FECompUltimoAutorizado
    const lastVoucher = await callAfipWebService(config, 'FECompUltimoAutorizado', {
        PtoVta: data.puntoVenta,
        CbteTipo: data.tipoComprobante
    });

    const nextVoucher = (lastVoucher.CbteNro || 0) + 1;
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

    const params = {
        FeCAEReq: {
            FeCabReq: {
                CantReg: 1,
                PtoVta: data.puntoVenta,
                CbteTipo: data.tipoComprobante
            },
            FeDetReq: {
                FECAEDetRequest: [
                    {
                        Concepto: data.concepto,
                        DocTipo: data.docTipo,
                        DocNro: data.docNro,
                        CbteDesde: nextVoucher,
                        CbteHasta: nextVoucher,
                        CbteFch: date,
                        ImpTotal: data.impTotal,
                        ImpTotConc: 0,
                        ImpNeto: data.impTotal,
                        ImpOpEx: 0,
                        ImpTrib: 0,
                        ImpIVA: 0,
                        MonId: 'PES',
                        MonCotiz: 1
                    }
                ]
            }
        }
    };

    const result = await callAfipWebService(config, 'FECAESolicitar', params);

    // Check if result has errors
    if (result.FeDetResp?.FECAEDetResponse?.[0]?.Resultado === 'R') {
        const obs = result.FeDetResp.FECAEDetResponse[0].Observaciones?.Obs?.[0]?.Msg || 'Unknown error';
        throw new Error(`AFIP Rejected: ${obs}`);
    }

    return {
        cae: result.FeDetResp?.FECAEDetResponse?.[0]?.CAE,
        caeExpiration: result.FeDetResp?.FECAEDetResponse?.[0]?.CAEFchVto,
        invoiceNumber: nextVoucher,
    };
}
