import { Card } from '@mui/material'
import GenericForm from '../../components/GenericForm'

function SelectDateRange({ dateRange, setDateRange }) {


  // הגדרת השדות עבור GenericForm
  const fields = [
    {
      type: 'title',
      label: 'בחירת טווח תאריכים לדו"ח'
    },
    {
      type: 'date',
      name: 'startDate',
      label: 'תאריך התחלה',
      required: true,
      datePicker: true,
      size: 6,
      max: new Date().toISOString().split("T")[0]
    },
    {
      type: 'date',
      name: 'endDate',
      label: 'תאריך סיום',
      required: true,
      datePicker: true,
      size: 6,
      min: dateRange.startDate, // תאריך הסיום לא יכול להיות לפני תאריך ההתחלה
      max: new Date().toISOString().split("T")[0]
    },
    {type: 'submit', label: 'הצג דו"ח', variant: "contained"}
  ]

  const handleSubmit = (formData) => {
    console.log('טווח התאריכים שנבחר:', formData)
    setDateRange(formData)
  }

  return (
    <Card sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <GenericForm
        fields={fields}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}

export default SelectDateRange