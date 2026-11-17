import { TopBar } from '../components/ui'

export default function Safety() {
  return (
    <>
      <TopBar back title="Safety & privacy" />
      <article className="prose">
        <h2>Meeting up</h2>
        <ul>
          <li>Plans take place at public Spots. Don’t agree to meet at a private address.</li>
          <li>You must be 18 or over to use Spotlight.</li>
          <li>Meet inside the Spot, where staff are around.</li>
          <li>Don’t put your phone number, home address or social accounts in a plan.</li>
          <li>Use <strong>Report</strong> on a plan if something doesn’t feel right. Call 112 in an emergency.</li>
          <li>You can leave a plan before checking in.</li>
        </ul>

        <h2>Data and privacy</h2>
        <p>
          Spotlight is a student prototype (MVP) built for a university course. To use it we store your email address,
          your first name, username, any profile photo you submit, the plans you post or join, your check-ins and reports.
        </p>
        <p>
          Other signed-in users can see your first name on Plans you join. Your username appears in Amigos search and connection lists when your profile is discoverable. Approved profile photos are visible to signed-in users; photos stay private until reviewed. Your email is not shown to other users.
        </p>
        <p>
          For the course evaluation we log what you do in the app (for example "joined a plan" or "checked in") with a
          timestamp, so we can measure whether the flow works and how long it takes. The data is only used for this
          test, and is deleted when the course ends. Ask the team to delete your account and data at any time.
        </p>

        <h2>About this test</h2>
        <ul>
          <li>The Spots, addresses and discounts in this version are fictional. No real businesses are involved.</li>
          <li>In a live version, the Spot team would provide the check-in code. For this test, ask the facilitator.</li>
          <li>The app doesn’t take payment. In a live version, the Spot would apply the discount.</li>
        </ul>
      </article>
    </>
  )
}
