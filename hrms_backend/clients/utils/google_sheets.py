def read_recipients_from_google_sheet(sheet_id, reminder_level=None, return_df=False):
    from oauth2client.service_account import ServiceAccountCredentials
    import gspread
    import pandas as pd
    from django.conf import settings

    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds = ServiceAccountCredentials.from_json_keyfile_name(
        settings.GOOGLE_SHEETS_CREDENTIALS, scope
    )
    client = gspread.authorize(creds)

    try:
        worksheet = client.open_by_key(sheet_id).sheet1  # first tab only
    except Exception as e:
        raise Exception(f"Could not open sheet: {e}")

    records = worksheet.get_all_records()
    df = pd.DataFrame(records)

    if return_df:
        return df

    emails, cc_list = [], []
    for _, row in df.iterrows():
        email = str(row.get("Email Address", "")).strip()
        if not email:
            continue

        if reminder_level:
            col_name = f"{reminder_level} Reminder"
            if str(row.get(col_name, "")).strip().upper() == 'Y':
                continue

        emails.append(email)
        cc_list.append(str(row.get("CC", "")).strip())

    return emails, cc_list
