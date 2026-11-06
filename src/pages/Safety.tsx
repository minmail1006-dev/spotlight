import { TopBar } from '../components/ui'

export default function Safety() {
  return (
    <>
      <TopBar back title="Safety & privacy" />
      <article className="prose">
        <h2>Meeting safely</h2>
        <ul>
          <li>Plans can only be posted at public partner venues. Never meet somewhere private.</li>
          <li>Spotlight is for people aged 18 or over.</li>
          <li>Meet inside the venue, near the staff. Staff know what Spotlight is.</li>
          <li>Don't share your phone number, address or social media in a plan.</li>
          <li>Use the <strong>Report</strong> button on any plan if something feels wrong. In an emergency, call 112.</li>
          <li>You can leave a plan at any time before you check in, no explanation needed.</li>
        </ul>

        <h2>What data we store</h2>
        <p>
          Spotlight is a student prototype (MVP) built for a university course. To use it we store your email address,
          your first name, the plans you post or join, your check-ins and reports.
        </p>
        <p>
          Other signed-in users can see your first name on plans you join. They cannot see your email.
        </p>
        <p>
          For the course evaluation we log what you do in the app (for example "joined a plan" or "checked in") with a
          timestamp, so we can measure whether the flow works and how long it takes. The data is only used for this
          test, and is deleted when the course ends. Ask the team to delete your account and data at any time.
        </p>

        <h2>What is simulated</h2>
        <ul>
          <li>All venues, addresses and discounts are fictional. No real business is part of this test.</li>
          <li>The check-in code would be given by venue staff. In the test, the facilitator gives it to you.</li>
          <li>No payment happens in the app. The discount would be applied by the venue.</li>
        </ul>
      </article>
    </>
  )
}
