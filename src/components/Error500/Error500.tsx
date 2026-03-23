

export default function Error500() {
    return(
        <div className="p-4 text-center alert alert-danger mx-auto" style={{maxWidth: "500px"}}>
            <h4 className="alert-heading">Error 500!</h4>
            <p>There is currently a problem with the API</p>
        </div>
    )
}